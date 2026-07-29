import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import {
  CreateProfessionalContractDto,
  CreateProfessionalSettlementDto,
  MarkProfessionalSettlementPaidDto,
  SetProfessionalContractStatusDto,
} from './dto/professional-finance.dto';

@Injectable()
export class ProfessionalFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  dashboard() {
    return this.prisma.forTenant(async (tx) => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [professionals, contracts, pending, paidThisMonth] = await Promise.all([
        tx.user.findMany({
          where: {
            role: { in: ['TRAINER', 'NUTRITIONIST'] },
            isActive: true,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            role: true,
            profileImageUrl: true,
            trainerProfile: {
              select: {
                specialties: true,
                _count: {
                  select: { students: { where: { isActive: true } } },
                },
              },
            },
            nutritionistProfile: {
              select: {
                _count: {
                  select: { clients: { where: { isActive: true } } },
                },
              },
            },
            financialAccounts: {
              select: {
                id: true,
                label: true,
                scope: true,
                bankName: true,
                iban: true,
                cardLast4: true,
                isDefault: true,
              },
              orderBy: { isDefault: 'desc' },
              take: 1,
            },
          },
          orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
        }),
        tx.professionalContract.findMany({
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                mobile: true,
                role: true,
              },
            },
            settlements: {
              orderBy: { createdAt: 'desc' },
              take: 12,
            },
          },
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
        tx.professionalSettlement.aggregate({
          where: { status: 'PENDING' },
          _sum: { netAmount: true },
          _count: true,
        }),
        tx.professionalSettlement.aggregate({
          where: { status: 'PAID', paidAt: { gte: startOfMonth } },
          _sum: { netAmount: true },
          _count: true,
        }),
      ]);

      const normalizedProfessionals = professionals.map((professional) => ({
        ...professional,
        activeClientCount:
          professional.role === 'TRAINER'
            ? (professional.trainerProfile?._count.students ?? 0)
            : (professional.nutritionistProfile?._count.clients ?? 0),
        settlementAccount: professional.financialAccounts[0] ?? null,
      }));

      return {
        professionals: normalizedProfessionals,
        contracts,
        summary: {
          activeContracts: contracts.filter((item) => item.status === 'ACTIVE').length,
          pendingSettlements: pending._count,
          pendingAmount: Number(pending._sum.netAmount ?? 0),
          paidThisMonthCount: paidThisMonth._count,
          paidThisMonthAmount: Number(paidThisMonth._sum.netAmount ?? 0),
          professionalsWithoutAccount: normalizedProfessionals.filter(
            (item) => !item.settlementAccount,
          ).length,
        },
      };
    });
  }

  async createContract(actorId: string, dto: CreateProfessionalContractDto) {
    this.validateContractTerms(dto);
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (endDate && endDate <= startDate) {
      throw new BadRequestException('تاریخ پایان قرارداد باید بعد از تاریخ شروع باشد.');
    }
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.forTenant(async (tx) => {
      const professional = await tx.user.findFirst({
        where: {
          id: dto.professionalId,
          role: { in: ['TRAINER', 'NUTRITIONIST'] },
          isActive: true,
        },
        select: { id: true, role: true },
      });
      if (!professional) {
        throw new NotFoundException('مربی یا مشاور فعال در این باشگاه یافت نشد.');
      }
      const active = await tx.professionalContract.findFirst({
        where: { professionalId: dto.professionalId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (active) {
        throw new ConflictException('برای این متخصص یک قرارداد فعال وجود دارد.');
      }

      const contract = await tx.professionalContract.create({
        data: {
          tenantId,
          professionalId: dto.professionalId,
          createdById: actorId,
          type: dto.type,
          billingCycle: dto.billingCycle,
          fixedAmount:
            dto.type === 'FIXED' || dto.type === 'HYBRID'
              ? dto.fixedAmount
              : null,
          sharePercent:
            dto.type === 'REVENUE_SHARE' || dto.type === 'HYBRID'
              ? dto.sharePercent
              : null,
          perClientAmount:
            dto.type === 'PER_CLIENT' || dto.type === 'HYBRID'
              ? dto.perClientAmount
              : null,
          startDate,
          endDate,
          notes: dto.notes?.trim() || null,
        },
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              role: true,
            },
          },
          settlements: true,
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          actorId,
          action: 'PROFESSIONAL_CONTRACT_CREATED',
          entityType: 'ProfessionalContract',
          entityId: contract.id,
          metadata: { professionalId: dto.professionalId, type: dto.type },
        },
      });
      return contract;
    });
  }

  async setContractStatus(
    actorId: string,
    contractId: string,
    dto: SetProfessionalContractStatusDto,
  ) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.forTenant(async (tx) => {
      const contract = await tx.professionalContract.findUnique({
        where: { id: contractId },
      });
      if (!contract) throw new NotFoundException('قرارداد یافت نشد.');
      if (dto.status === 'ACTIVE') {
        const another = await tx.professionalContract.findFirst({
          where: {
            professionalId: contract.professionalId,
            status: 'ACTIVE',
            id: { not: contract.id },
          },
          select: { id: true },
        });
        if (another) {
          throw new ConflictException('برای این متخصص یک قرارداد فعال دیگر وجود دارد.');
        }
      }
      const updated = await tx.professionalContract.update({
        where: { id: contractId },
        data: {
          status: dto.status,
          ...(dto.status === 'ENDED' && !contract.endDate
            ? { endDate: new Date() }
            : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          actorId,
          action: 'PROFESSIONAL_CONTRACT_STATUS_CHANGED',
          entityType: 'ProfessionalContract',
          entityId: contract.id,
          metadata: { previous: contract.status, current: dto.status },
        },
      });
      return updated;
    });
  }

  async createSettlement(
    actorId: string,
    contractId: string,
    dto: CreateProfessionalSettlementDto,
  ) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodStart >= periodEnd) {
      throw new BadRequestException('پایان دوره تسویه باید بعد از شروع دوره باشد.');
    }
    if ((periodEnd.getTime() - periodStart.getTime()) / 86_400_000 > 366) {
      throw new BadRequestException('دوره تسویه نمی‌تواند بیشتر از یک سال باشد.');
    }
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.forTenant(async (tx) => {
      const contract = await tx.professionalContract.findUnique({
        where: { id: contractId },
        include: {
          professional: { select: { id: true, role: true } },
        },
      });
      if (!contract) throw new NotFoundException('قرارداد یافت نشد.');
      if (contract.status !== 'ACTIVE') {
        throw new BadRequestException('فقط برای قرارداد فعال می‌توان تسویه ساخت.');
      }
      const duplicate = await tx.professionalSettlement.findFirst({
        where: {
          contractId,
          status: { not: 'CANCELLED' },
          periodStart: { lt: periodEnd },
          periodEnd: { gt: periodStart },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('این بازه با یک تسویه قبلی هم‌پوشانی دارد.');
      }

      if (Number(contract.sharePercent ?? 0) > 0 && dto.baseRevenue === undefined) {
        throw new BadRequestException('درآمد مبنای محاسبه درصد را وارد کنید؛ در صورت نبود درآمد، صفر ثبت کنید.');
      }
      const clientCount = await this.countActiveClients(
        tx,
        contract.professional.id,
        contract.professional.role,
      );
      const baseRevenue = dto.baseRevenue ?? 0;
      const fixed = Number(contract.fixedAmount ?? 0);
      const share = (baseRevenue * Number(contract.sharePercent ?? 0)) / 100;
      const perClient = clientCount * Number(contract.perClientAmount ?? 0);
      const grossAmount = this.roundMoney(fixed + share + perClient);
      const deductions = this.roundMoney(dto.deductions ?? 0);
      if (deductions > grossAmount) {
        throw new BadRequestException('کسورات نمی‌تواند بیشتر از مبلغ ناخالص باشد.');
      }
      const netAmount = this.roundMoney(grossAmount - deductions);

      const settlement = await tx.professionalSettlement.create({
        data: {
          tenantId,
          contractId,
          createdById: actorId,
          periodStart,
          periodEnd,
          baseRevenue,
          clientCount,
          grossAmount,
          deductions,
          netAmount,
          notes: dto.notes?.trim() || null,
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          actorId,
          action: 'PROFESSIONAL_SETTLEMENT_CREATED',
          entityType: 'ProfessionalSettlement',
          entityId: settlement.id,
          metadata: { contractId, clientCount, grossAmount, deductions, netAmount },
        },
      });
      return settlement;
    });
  }

  async markSettlementPaid(
    actorId: string,
    settlementId: string,
    dto: MarkProfessionalSettlementPaidDto,
  ) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.forTenant(async (tx) => {
      const settlement = await tx.professionalSettlement.findUnique({
        where: { id: settlementId },
      });
      if (!settlement) throw new NotFoundException('تسویه یافت نشد.');
      if (settlement.status !== 'PENDING') {
        throw new BadRequestException('این تسویه دیگر در انتظار پرداخت نیست.');
      }
      const paidAt = new Date();
      const updated = await tx.professionalSettlement.update({
        where: { id: settlementId },
        data: {
          status: 'PAID',
          paymentMethod: dto.paymentMethod,
          paymentRef: dto.paymentRef?.trim() || null,
          paidAt,
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          actorId,
          action: 'PROFESSIONAL_SETTLEMENT_PAID',
          entityType: 'ProfessionalSettlement',
          entityId: settlement.id,
          metadata: {
            netAmount: Number(settlement.netAmount),
            paymentMethod: dto.paymentMethod,
          },
        },
      });
      return updated;
    });
  }

  private validateContractTerms(dto: CreateProfessionalContractDto) {
    const fixed = dto.fixedAmount ?? 0;
    const share = dto.sharePercent ?? 0;
    const perClient = dto.perClientAmount ?? 0;
    if (dto.type === 'FIXED' && fixed <= 0) {
      throw new BadRequestException('مبلغ ثابت قرارداد را وارد کنید.');
    }
    if (dto.type === 'REVENUE_SHARE' && share <= 0) {
      throw new BadRequestException('درصد سهم قرارداد را وارد کنید.');
    }
    if (dto.type === 'PER_CLIENT' && perClient <= 0) {
      throw new BadRequestException('مبلغ هر شاگرد را وارد کنید.');
    }
    if (dto.type === 'HYBRID' && fixed <= 0 && share <= 0 && perClient <= 0) {
      throw new BadRequestException('حداقل یکی از اجزای مالی قرارداد ترکیبی را وارد کنید.');
    }
  }

  private async countActiveClients(
    tx: PrismaClient,
    professionalId: string,
    role: string,
  ) {
    if (role === 'TRAINER') {
      const profile = await tx.trainerProfile.findUnique({
        where: { userId: professionalId },
        select: { id: true },
      });
      if (!profile) return 0;
      return tx.trainerStudent.count({
        where: { trainerId: profile.id, isActive: true },
      });
    }
    const profile = await tx.nutritionistProfile.findUnique({
      where: { userId: professionalId },
      select: { id: true },
    });
    if (!profile) return 0;
    return tx.nutritionistClient.count({
      where: { nutritionistId: profile.id, isActive: true },
    });
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
