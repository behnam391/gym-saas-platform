import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CreateDietPlanDto, UpdateDietStatusDto } from './dto/diet.dto';

@Injectable()
export class DietService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  async create(nutritionistUserId: string, dto: CreateDietPlanDto) {
    return this.prisma.forTenant(async (tx) => {
      const nutritionist = await tx.nutritionistProfile.findUnique({
        where: { userId: nutritionistUserId },
      });
      if (!nutritionist || nutritionist.status !== 'APPROVED') {
        throw new ForbiddenException('متخصص تغذیه هنوز توسط Super Admin تایید نشده است.');
      }

      const athlete = await tx.athleteProfile.findUnique({ where: { userId: dto.athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');

      const assignment = await tx.nutritionistClient.findUnique({
        where: {
          nutritionistId_athleteId: {
            nutritionistId: nutritionist.id,
            athleteId: athlete.id,
          },
        },
      });
      if (!assignment?.isActive) {
        throw new ForbiddenException('این ورزشکار به شما اختصاص داده نشده است.');
      }

      this.validateDateRange(dto.startDate, dto.endDate);

      if (dto.sourceAISuggestionId) {
        const suggestion = await tx.aiSuggestion.findUnique({
          where: { id: dto.sourceAISuggestionId },
        });
        if (!suggestion || suggestion.status !== 'APPROVED') {
          throw new BadRequestException(
            'پیشنهاد هوش مصنوعی باید قبل از تبدیل به رژیم فعال، تایید شود.',
          );
        }
      }

      await tx.dietPlan.updateMany({
        where: { athleteId: athlete.id, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });

      return tx.dietPlan.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          nutritionistId: nutritionist.id,
          athleteId: athlete.id,
          title: dto.title,
          goal: dto.goal as any,
          dailyCalories: dto.dailyCalories,
          status: 'ACTIVE',
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          sourceAISuggestionId: dto.sourceAISuggestionId,
          meals: {
            create: dto.meals.map((m, idx) => ({
              mealTime: m.mealTime,
              description: m.description,
              calories: m.calories,
              sortOrder: idx,
            })),
          },
        },
        include: {
          nutritionist: { include: { user: { select: { firstName: true, lastName: true } } } },
          athlete: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          meals: true,
        },
      });
    });
  }

  listForAthlete(
    athleteUserId: string,
    options: { hideDrafts?: boolean; nutritionistUserId?: string } | boolean = {},
  ) {
    const normalizedOptions =
      typeof options === 'boolean' ? { hideDrafts: options } : options;
    return this.prisma.forTenant(async (tx) => {
      const athlete = await tx.athleteProfile.findUnique({ where: { userId: athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');

      if (normalizedOptions.nutritionistUserId) {
        const assignment = await tx.nutritionistClient.findFirst({
          where: {
            athleteId: athlete.id,
            isActive: true,
            nutritionist: { userId: normalizedOptions.nutritionistUserId },
          },
        });
        if (!assignment) {
          throw new ForbiddenException('این ورزشکار به شما اختصاص داده نشده است.');
        }
      }

      return tx.dietPlan.findMany({
        where: {
          athleteId: athlete.id,
          ...(normalizedOptions.hideDrafts ? { status: { not: 'DRAFT' as const } } : {}),
        },
        include: {
          nutritionist: { include: { user: { select: { firstName: true, lastName: true } } } },
          athlete: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          meals: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  updateStatus(nutritionistUserId: string, dietPlanId: string, dto: UpdateDietStatusDto) {
    return this.prisma.forTenant(async (tx) => {
      const plan = await tx.dietPlan.findFirst({
        where: { id: dietPlanId, nutritionist: { userId: nutritionistUserId } },
        select: { id: true, athleteId: true },
      });
      if (!plan) throw new NotFoundException('برنامه غذایی متعلق به شما یافت نشد.');

      if (dto.status === 'ACTIVE') {
        await tx.dietPlan.updateMany({
          where: {
            athleteId: plan.athleteId,
            status: 'ACTIVE',
            id: { not: plan.id },
          },
          data: { status: 'ARCHIVED' },
        });
      }

      return tx.dietPlan.update({
        where: { id: plan.id },
        data: { status: dto.status as any },
      });
    });
  }

  private validateDateRange(startDate?: string, endDate?: string) {
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new BadRequestException('تاریخ پایان رژیم باید بعد از تاریخ شروع باشد.');
    }
  }
}
