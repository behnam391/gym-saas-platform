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

      return tx.dietPlan.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          nutritionistId: nutritionist.id,
          athleteId: athlete.id,
          title: dto.title,
          goal: dto.goal as any,
          dailyCalories: dto.dailyCalories,
          status: 'ACTIVE',
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
          meals: true,
        },
      });
    });
  }

  listForAthlete(athleteUserId: string, hideDrafts = false) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await tx.athleteProfile.findUnique({ where: { userId: athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');
      return tx.dietPlan.findMany({
        where: {
          athleteId: athlete.id,
          ...(hideDrafts ? { status: { not: 'DRAFT' as const } } : {}),
        },
        include: {
          nutritionist: { include: { user: { select: { firstName: true, lastName: true } } } },
          meals: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  updateStatus(dietPlanId: string, dto: UpdateDietStatusDto) {
    return this.prisma.forTenant((tx) =>
      tx.dietPlan.update({ where: { id: dietPlanId }, data: { status: dto.status as any } }),
    );
  }
}
