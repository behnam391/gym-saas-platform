import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyNutritionistDto, AssignClientDto, ReviewNutritionistDto } from './dto/nutritionist.dto';

@Injectable()
export class NutritionistsService {
  constructor(private readonly prisma: PrismaService) {}

  apply(userId: string, dto: ApplyNutritionistDto) {
    return this.prisma.forTenant((tx) =>
      tx.nutritionistProfile.upsert({
        where: { userId },
        update: { ...dto, status: 'PENDING', rejectionReason: null },
        create: { userId, ...dto },
      }),
    );
  }

  getMine(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.nutritionistProfile.findUnique({ where: { userId } }),
    );
  }

  listClients(userId: string) {
    return this.prisma.forTenant(async (tx) => {
      const nutritionist = await tx.nutritionistProfile.findUnique({ where: { userId } });
      if (!nutritionist) throw new NotFoundException('پروفایل متخصص تغذیه یافت نشد.');
      return tx.nutritionistClient.findMany({
        where: { nutritionistId: nutritionist.id, isActive: true },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, mobile: true } },
          athlete: { include: { measurements: { orderBy: { recordedAt: 'desc' }, take: 1 }, goals: { where: { achieved: false } } } },
        },
        orderBy: { startedAt: 'desc' },
      });
    });
  }

  assignClient(userId: string, dto: AssignClientDto) {
    return this.prisma.forTenant(async (tx) => {
      const nutritionist = await tx.nutritionistProfile.findUnique({ where: { userId } });
      if (!nutritionist || nutritionist.status !== 'APPROVED') {
        throw new BadRequestException('حساب متخصص تغذیه هنوز تایید نشده است.');
      }
      const athlete = await tx.athleteProfile.findUnique({ where: { userId: dto.athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');
      return tx.nutritionistClient.upsert({
        where: { nutritionistId_athleteId: { nutritionistId: nutritionist.id, athleteId: athlete.id } },
        create: { nutritionistId: nutritionist.id, athleteId: athlete.id, userId: dto.athleteUserId },
        update: { isActive: true, endedAt: null, userId: dto.athleteUserId },
      });
    });
  }

  /**
   * Per spec: nutritionists can be approved ONLY by Super Admin, and a
   * super admin legitimately needs to see/approve applications across every
   * tenant — so this one path uses `forPlatform()` (RLS-bypass connection).
   * The controller MUST guard this with @Roles('SUPER_ADMIN'); forPlatform()
   * does not re-check the role itself.
   */
  listPendingPlatformWide() {
    const db = this.prisma.forPlatform();
    return db.nutritionistProfile.findMany({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: {
        user: {
          select: { firstName: true, lastName: true, mobile: true, tenantId: true },
        },
      },
    });
  }

  async review(nutritionistProfileId: string, approverId: string, dto: ReviewNutritionistDto) {
    const db = this.prisma.forPlatform();
    const profile = await db.nutritionistProfile.findUnique({ where: { id: nutritionistProfileId } });
    if (!profile) throw new NotFoundException('پروفایل متخصص تغذیه یافت نشد.');

    return db.nutritionistProfile.update({
      where: { id: nutritionistProfileId },
      data: {
        status: dto.status,
        approvedById: approverId,
        approvedAt: new Date(),
        rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
      },
    });
  }
}
