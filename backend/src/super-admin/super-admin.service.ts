import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignSubscriptionDto,
  ListUsersQueryDto,
  SetTenantActiveDto,
  SetUserAccessDto,
  UpdateIntegrationDto,
  VerifyTenantDto,
} from './dto/super-admin.dto';

const PLATFORM_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  mobile: true,
  email: true,
  role: true,
  isActive: true,
  isRestricted: true,
  createdAt: true,
  tenant: { select: { id: true, name: true, city: true } },
} satisfies Prisma.UserSelect;

const INTEGRATION_PUBLIC_SELECT = {
  id: true,
  key: true,
  label: true,
  category: true,
  provider: true,
  status: true,
  baseUrl: true,
  requiredEnvVars: true,
  notes: true,
  configuredFields: true,
  lastCheckedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlatformIntegrationSelect;

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async platformOverview() {
    const db = this.prisma.forPlatform();
    const [tenantCount, userCount, activeMemberships, openTickets] = await Promise.all([
      db.tenant.count(),
      db.user.count(),
      db.membership.count({ where: { status: 'ACTIVE' } }),
      db.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);
    return { tenantCount, userCount, activeMemberships, openTickets };
  }

  listTenants() {
    const db = this.prisma.forPlatform();
    return db.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        province: true,
        county: true,
        city: true,
        isActive: true,
        isVerified: true,
        trustScore: true,
        createdAt: true,
        _count: { select: { users: true, memberships: true } },
        subscription: {
          select: {
            status: true,
            renewsAt: true,
            plan: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  async verifyTenant(tenantId: string, dto: VerifyTenantDto) {
    const db = this.prisma.forPlatform();
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('باشگاه یافت نشد.');
    return db.tenant.update({ where: { id: tenantId }, data: { isVerified: dto.isVerified } });
  }

  async setTenantActive(tenantId: string, dto: SetTenantActiveDto) {
    const db = this.prisma.forPlatform();
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('باشگاه یافت نشد.');
    return db.tenant.update({ where: { id: tenantId }, data: { isActive: dto.isActive } });
  }

  async listUsers(query: ListUsersQueryDto) {
    const db = this.prisma.forPlatform();
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { mobile: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
              { tenant: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total, activeCount, restrictedCount] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 250,
        select: PLATFORM_USER_SELECT,
      }),
      db.user.count({ where }),
      db.user.count({ where: { ...where, isActive: true } }),
      db.user.count({ where: { ...where, isRestricted: true } }),
    ]);

    return { items, total, activeCount, restrictedCount };
  }

  async setUserAccess(userId: string, dto: SetUserAccessDto) {
    if (dto.isActive === undefined && dto.isRestricted === undefined) {
      throw new BadRequestException('حداقل یک وضعیت دسترسی باید ارسال شود.');
    }

    const db = this.prisma.forPlatform();
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, tenantId: true } });
    if (!user) throw new NotFoundException('کاربر یافت نشد.');
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('تغییر دسترسی مدیر ارشد از این بخش مجاز نیست.');
    }

    return db.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.isRestricted !== undefined ? { isRestricted: dto.isRestricted } : {}),
        },
        select: PLATFORM_USER_SELECT,
      });
      if (dto.isActive === false) {
        await tx.refreshToken.deleteMany({ where: { userId } });
      }
      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          action: 'SUPER_ADMIN_USER_ACCESS_UPDATED',
          entityType: 'User',
          entityId: userId,
          metadata: {
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
            ...(dto.isRestricted !== undefined ? { isRestricted: dto.isRestricted } : {}),
          },
        },
      });
      return updated;
    });
  }

  rankings() {
    const db = this.prisma.forPlatform();
    return db.tenant.findMany({
      where: { isActive: true, isVerified: true },
      orderBy: { trustScore: 'desc' },
      take: 50,
      select: { id: true, name: true, city: true, trustScore: true },
    });
  }

  /** Cross-tenant financial summary — payments table has tenantId but a
   * platform-wide rollup legitimately needs to read across all of them. */
  async financialSummary() {
    const db = this.prisma.forPlatform();
    const result = await db.payment.groupBy({
      by: ['tenantId'],
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
      _count: true,
    });
    return result;
  }

  listAllTickets() {
    const db = this.prisma.forPlatform();
    return db.ticket.findMany({
      where: { targetType: 'PLATFORM' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  listIntegrations() {
    return this.prisma.forPlatform().platformIntegration.findMany({
      select: INTEGRATION_PUBLIC_SELECT,
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });
  }

  async updateIntegration(key: string, dto: UpdateIntegrationDto) {
    const db = this.prisma.forPlatform();
    const integration = await db.platformIntegration.findUnique({ where: { key } });
    if (!integration) throw new NotFoundException('اتصال سامانه یافت نشد.');
    return db.platformIntegration.update({
      where: { key },
      data: { ...dto, lastCheckedAt: dto.status === 'HEALTHY' ? new Date() : integration.lastCheckedAt },
      select: INTEGRATION_PUBLIC_SELECT,
    });
  }

  async listSubscriptions() {
    const db = this.prisma.forPlatform();
    const [plans, subscriptions] = await Promise.all([
      db.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } }),
      db.tenantSubscription.findMany({ include: { plan: true, tenant: { select: { id: true, name: true, city: true } } }, orderBy: { updatedAt: 'desc' } }),
    ]);
    return { plans, subscriptions };
  }

  async assignSubscription(tenantId: string, dto: AssignSubscriptionDto) {
    const db = this.prisma.forPlatform();
    const [tenant, plan] = await Promise.all([
      db.tenant.findUnique({ where: { id: tenantId } }),
      db.subscriptionPlan.findUnique({ where: { code: dto.planCode } }),
    ]);
    if (!tenant) throw new NotFoundException('باشگاه یافت نشد.');
    if (!plan) throw new NotFoundException('پلن اشتراک یافت نشد.');
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);
    return db.tenantSubscription.upsert({
      where: { tenantId },
      create: { tenantId, planId: plan.id, status: dto.status, renewsAt },
      update: { planId: plan.id, status: dto.status, renewsAt },
      include: { plan: true, tenant: { select: { id: true, name: true } } },
    });
  }
}
