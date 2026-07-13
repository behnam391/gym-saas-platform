import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyNutritionistDto, ReviewNutritionistDto } from './dto/nutritionist.dto';

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
