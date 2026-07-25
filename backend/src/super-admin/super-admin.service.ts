import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyTenantDto, SetTenantActiveDto, UpdateIntegrationDto, AssignSubscriptionDto } from './dto/super-admin.dto';

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
        city: true,
        isActive: true,
        isVerified: true,
        trustScore: true,
        createdAt: true,
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
    return this.prisma.forPlatform().platformIntegration.findMany({ orderBy: [{ category: 'asc' }, { label: 'asc' }] });
  }

  async updateIntegration(key: string, dto: UpdateIntegrationDto) {
    const db = this.prisma.forPlatform();
    const integration = await db.platformIntegration.findUnique({ where: { key } });
    if (!integration) throw new NotFoundException('اتصال سامانه یافت نشد.');
    return db.platformIntegration.update({
      where: { key },
      data: { ...dto, lastCheckedAt: dto.status === 'HEALTHY' ? new Date() : integration.lastCheckedAt },
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
