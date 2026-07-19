import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { RecordManualPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  recordManualPayment(membershipId: string, dto: RecordManualPaymentDto) {
    return this.prisma.forTenant(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: membershipId },
        include: {
          plan: true,
          user: { include: { insuranceDocs: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 1 } } },
        },
      });
      if (!membership) throw new NotFoundException('عضویت یافت نشد.');
      if (membership.status === 'ACTIVE') throw new BadRequestException('این عضویت قبلاً فعال شده است.');
      if (membership.status === 'CANCELLED' || membership.status === 'SUSPENDED') {
        throw new BadRequestException('برای این عضویت امکان ثبت پرداخت وجود ندارد.');
      }

      const insurance = membership.user.insuranceDocs[0];
      if (!insurance || (insurance.validUntil && insurance.validUntil < new Date())) {
        throw new BadRequestException('بیمه ورزشی معتبر و تاییدشده برای این کاربر ثبت نشده است.');
      }
      if (dto.amount < Number(membership.plan.price)) {
        throw new BadRequestException('مبلغ پرداختی از مبلغ پلن عضویت کمتر است.');
      }

      const duplicate = await tx.payment.findFirst({
        where: { membershipId, status: 'SUCCEEDED' },
      });
      if (duplicate) throw new BadRequestException('پرداخت موفق برای این عضویت قبلاً ثبت شده است.');

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + membership.plan.durationDays);

      const payment = await tx.payment.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          userId: membership.userId,
          membershipId,
          amount: dto.amount,
          method: dto.method,
          status: 'SUCCEEDED',
          gatewayRef: dto.gatewayRef,
          paidAt: now,
        },
      });
      await tx.membership.update({
        where: { id: membershipId },
        data: { status: 'ACTIVE', startDate: now, endDate },
      });
      return payment;
    });
  }

  listForTenant() {
    return this.prisma.forTenant((tx) =>
      tx.payment.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, mobile: true } },
          membership: { include: { plan: true } },
          order: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 250,
      }),
    );
  }

  listMine(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.payment.findMany({
        where: { userId },
        include: { membership: { include: { plan: true } }, order: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }

  summary() {
    return this.prisma.forTenant(async (tx) => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const [payments, pendingCount, activeMemberships] = await Promise.all([
        tx.payment.aggregate({
          where: { status: 'SUCCEEDED', paidAt: { gte: startOfMonth } },
          _sum: { amount: true },
          _count: true,
        }),
        tx.payment.count({ where: { status: 'PENDING' } }),
        tx.membership.count({ where: { status: 'ACTIVE' } }),
      ]);
      return {
        revenueThisMonth: Number(payments._sum.amount ?? 0),
        successfulPaymentsThisMonth: payments._count,
        pendingPayments: pendingCount,
        activeMemberships,
      };
    });
  }
}

