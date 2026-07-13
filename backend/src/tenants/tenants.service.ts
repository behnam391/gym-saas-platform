import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import {
  SearchTenantsDto,
  UpdateTenantProfileDto,
  CreateMembershipPlanDto,
  ReviewInsuranceDto,
  ReviewParentalConsentDto,
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
        ...(dto.city ? { city: dto.city } : {}),
        ...(dto.gender ? { OR: [{ genderPolicy: dto.gender }, { genderPolicy: null }] } : {}),
        ...(dto.minRating ? { trustScore: { gte: dto.minRating } } : {}),
        ...(dto.facilities?.length
          ? { facilities: { some: { name: { in: dto.facilities } } } }
          : {}),
        ...(dto.minPrice || dto.maxPrice
          ? {
              membershipPlans: {
                some: {
                  isActive: true,
                  ...(dto.minPrice ? { price: { gte: dto.minPrice } } : {}),
                  ...(dto.maxPrice ? { price: { lte: dto.maxPrice } } : {}),
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

    if (dto.latitude && dto.longitude) {
      return tenants
        .map((t) => ({
          ...t,
          distanceKm:
            t.latitude && t.longitude
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
      },
    });
    if (!tenant || !tenant.isActive) throw new NotFoundException('باشگاه یافت نشد.');
    return tenant;
  }

  updateMyProfile(dto: UpdateTenantProfileDto) {
    const tenantId = this.tenantContext.requireTenantId();
    // Profile fields live on Tenant itself (not a tenant-scoped child table),
    // so this still goes through the gym owner's own tenant id explicitly,
    // via the platform connection (Tenant has no RLS policy — see rls-policies.sql).
    const db = this.prisma.forPlatform();
    return db.tenant.update({ where: { id: tenantId }, data: dto as any });
  }

  createMembershipPlan(dto: CreateMembershipPlanDto) {
    return this.prisma.forTenant((tx) =>
      tx.membershipPlan.create({
        data: { ...dto, tenantId: this.tenantContext.requireTenantId() },
      }),
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
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async reviewInsurance(documentId: string, reviewerId: string, dto: ReviewInsuranceDto) {
    return this.prisma.forTenant(async (tx) => {
      const doc = await tx.insuranceDocument.findUnique({ where: { id: documentId } });
      if (!doc) throw new NotFoundException('سند بیمه یافت نشد.');
      return tx.insuranceDocument.update({
        where: { id: documentId },
        data: {
          status: dto.status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
        },
      });
    });
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
