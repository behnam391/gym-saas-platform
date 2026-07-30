import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { NotificationsService } from '../notifications/notifications.service';
import {
  SearchTenantsDto,
  UpdateTenantProfileDto,
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
  ReviewInsuranceDto,
  ReviewParentalConsentDto,
  AddTenantGalleryImageDto,
} from './dto/tenant.dto';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Public marketplace search has no single tenant to scope to by
   * definition — it searches ACROSS every gym. This is the third
   * legitimate use of `forPlatform()` alongside pre-auth flows and true
   * Super-Admin endpoints: it's read-only, touches no PII beyond what a
   * gym already published for public display, and every other module in
   * this codebase still goes through `forTenant()`.
   */
  async search(dto: SearchTenantsDto) {
    const db = this.prisma.forPlatform();

    const tenants = await db.tenant.findMany({
      where: {
        isActive: true,
        isVerified: true,
        ...(dto.province ? { province: { equals: dto.province, mode: 'insensitive' as const } } : {}),
        ...(dto.county ? { county: { equals: dto.county, mode: 'insensitive' as const } } : {}),
        ...(dto.city ? { city: { contains: dto.city, mode: 'insensitive' as const } } : {}),
        ...(dto.gender ? { OR: [{ genderPolicy: dto.gender }, { genderPolicy: null }] } : {}),
        ...(dto.minRating ? { trustScore: { gte: dto.minRating } } : {}),
        ...(dto.facilities?.length
          ? { facilities: { some: { name: { in: dto.facilities } } } }
          : {}),
        ...(dto.minPrice !== undefined || dto.maxPrice !== undefined
          ? {
              membershipPlans: {
                some: {
                  isActive: true,
                  ...(dto.minPrice !== undefined ? { price: { gte: dto.minPrice } } : {}),
                  ...(dto.maxPrice !== undefined ? { price: { lte: dto.maxPrice } } : {}),
                },
              },
            }
          : {}),
      },
      include: {
        facilities: true,
        membershipPlans: { where: { isActive: true } },
        galleryImages: { take: 3 },
      },
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      return tenants
        .map((t) => ({
          ...t,
          distanceKm:
            t.latitude !== null && t.longitude !== null
              ? haversineKm(dto.latitude!, dto.longitude!, t.latitude, t.longitude)
              : null,
        }))
        .filter((t) => !dto.maxDistanceKm || (t.distanceKm ?? Infinity) <= dto.maxDistanceKm)
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return tenants.sort((a, b) => b.trustScore - a.trustScore);
  }

  async getPublicProfile(slug: string) {
    const db = this.prisma.forPlatform();
    const tenant = await db.tenant.findUnique({
      where: { slug },
      include: {
        facilities: true,
        galleryImages: { orderBy: { sortOrder: 'asc' } },
        membershipPlans: { where: { isActive: true } },
        users: {
          where: { role: { in: ['TRAINER', 'NUTRITIONIST'] }, isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            trainerProfile: { select: { id: true, bio: true, specialties: true, status: true } },
            nutritionistProfile: { select: { id: true, bio: true, status: true, profileImageUrl: true } },
          },
        },
        reviews: {
          where: { targetType: 'GYM' },
          include: { author: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!tenant || !tenant.isActive || !tenant.isVerified) {
      throw new NotFoundException('باشگاه یافت نشد.');
    }
    const { users, reviews, ...profile } = tenant;
    return {
      ...profile,
      trainers: users
        .filter((user) => user.role === 'TRAINER' && user.trainerProfile?.status === 'APPROVED')
        .map((user) => ({
          id: user.trainerProfile!.id,
          name: `${user.firstName} ${user.lastName}`,
          specialty: user.trainerProfile!.specialties.join('، ') || 'مربی ورزشی',
          bio: user.trainerProfile!.bio,
        })),
      nutritionists: users
        .filter((user) => user.role === 'NUTRITIONIST' && user.nutritionistProfile?.status === 'APPROVED')
        .map((user) => ({
          id: user.nutritionistProfile!.id,
          name: `${user.firstName} ${user.lastName}`,
          specialty: 'تغذیه ورزشی',
          bio: user.nutritionistProfile!.bio,
          profileImageUrl: user.nutritionistProfile!.profileImageUrl,
        })),
      reviews: reviews.map((review) => ({
        id: review.id,
        author: `${review.author.firstName} ${review.author.lastName}`,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
    };
  }

  updateMyProfile(dto: UpdateTenantProfileDto) {
    const tenantId = this.tenantContext.requireTenantId();
    // Tenant itself is global for marketplace reads, so the trusted tenant id
    // from the verified JWT is still applied explicitly for this write.
    return this.prisma.forTenant((tx) =>
      tx.tenant.update({ where: { id: tenantId }, data: dto as any }),
    );
  }

  getMyProfile() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.forTenant((tx) =>
      tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          facilities: true,
          galleryImages: { orderBy: { sortOrder: 'asc' } },
          membershipPlans: { orderBy: { createdAt: 'desc' } },
          _count: { select: { users: true, memberships: true } },
        },
      }),
    );
  }

  addGalleryImage(dto: AddTenantGalleryImageDto) {
    return this.prisma.forTenant(async (tx) => {
      const tenantId = this.tenantContext.requireTenantId();
      const count = await tx.tenantGalleryImage.count();
      return tx.tenantGalleryImage.create({
        data: { tenantId, url: dto.url, type: dto.type ?? 'image', sortOrder: count },
      });
    });
  }

  removeGalleryImage(imageId: string) {
    return this.prisma.forTenant(async (tx) => {
      const image = await tx.tenantGalleryImage.findUnique({ where: { id: imageId } });
      if (!image) throw new NotFoundException('تصویر باشگاه یافت نشد.');
      await tx.tenantGalleryImage.delete({ where: { id: imageId } });
      return { message: 'تصویر از گالری حذف شد.' };
    });
  }

  listMembershipPlans() {
    return this.prisma.forTenant((tx) =>
      tx.membershipPlan.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] }),
    );
  }

  createMembershipPlan(dto: CreateMembershipPlanDto) {
    return this.prisma.forTenant((tx) =>
      tx.membershipPlan.create({
        data: { ...dto, tenantId: this.tenantContext.requireTenantId() },
      }),
    );
  }

  updateMembershipPlan(planId: string, dto: UpdateMembershipPlanDto) {
    return this.prisma.forTenant((tx) =>
      tx.membershipPlan.update({ where: { id: planId }, data: dto }),
    );
  }

  archiveMembershipPlan(planId: string) {
    return this.prisma.forTenant((tx) =>
      tx.membershipPlan.update({ where: { id: planId }, data: { isActive: false } }),
    );
  }

  listMembers() {
    return this.prisma.forTenant((tx) =>
      tx.user.findMany({
        where: { role: 'ATHLETE' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobile: true,
          isMinor: true,
          isRestricted: true,
          createdAt: true,
          insuranceDocs: { orderBy: { createdAt: 'desc' }, take: 1 },
          parentalConsent: true,
          memberships: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async reviewInsurance(documentId: string, reviewerId: string, dto: ReviewInsuranceDto) {
    const updated = await this.prisma.forTenant(async (tx) => {
      const doc = await tx.insuranceDocument.findUnique({ where: { id: documentId } });
      if (!doc) throw new NotFoundException('سند بیمه یافت نشد.');
      const updated = await tx.insuranceDocument.update({
        where: { id: documentId },
        data: {
          status: dto.status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
        },
      });
      if (dto.status === 'APPROVED') {
        await tx.membership.updateMany({
          where: { userId: doc.userId, status: 'PENDING_INSURANCE' },
          data: { status: 'PENDING_PAYMENT' },
        });
      }
      return updated;
    });

    await this.notifications.create({
      userId: updated.userId,
      title: dto.status === 'APPROVED' ? 'بیمه ورزشی تأیید شد' : 'مدرک بیمه نیاز به اصلاح دارد',
      body:
        dto.status === 'APPROVED'
          ? 'بیمه ورزشی شما تأیید شد و عضویت وارد مرحله پرداخت شده است.'
          : dto.rejectionReason || 'مدرک بیمه رد شد؛ لطفاً نسخه خوانا و معتبر را دوباره ارسال کنید.',
      metadata: {
        type: 'INSURANCE_REVIEW',
        documentId: updated.id,
        status: dto.status,
      },
    });

    return updated;
  }

  /** Approving consent lifts `isRestricted` on the minor's account —
   * this is the ONLY place that flag is ever cleared. */
  async reviewParentalConsent(
    consentUserId: string,
    reviewerId: string,
    dto: ReviewParentalConsentDto,
  ) {
    return this.prisma.forTenant(async (tx) => {
      const consent = await tx.parentalConsent.findUnique({ where: { userId: consentUserId } });
      if (!consent) throw new NotFoundException('رضایت‌نامه والدین یافت نشد.');

      await tx.parentalConsent.update({
        where: { userId: consentUserId },
        data: {
          status: dto.status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
        },
      });

      if (dto.status === 'APPROVED') {
        await tx.user.update({ where: { id: consentUserId }, data: { isRestricted: false } });
      }

      return { message: 'بررسی رضایت‌نامه ثبت شد.' };
    });
  }
}
