import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import {
  entitlementsForPlan,
  SubscriptionFeature,
  SubscriptionLimit,
} from './subscription-entitlements';

@Injectable()
export class SubscriptionAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  async getCurrentAccess() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.forTenant(async (tx) => {
      const subscription = await tx.tenantSubscription.findUnique({
        where: { tenantId },
        include: { plan: true },
      });
      if (!subscription) {
        return {
          status: 'NOT_SUBSCRIBED',
          planCode: null,
          planName: null,
          renewsAt: null,
          isOperational: false,
          features: [] as SubscriptionFeature[],
          limits: entitlementsForPlan('UNKNOWN').limits,
        };
      }

      const now = new Date();
      const expired =
        Boolean(subscription.renewsAt) && subscription.renewsAt! <= now;
      let status = subscription.status;
      if (
        expired &&
        (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL')
      ) {
        await tx.tenantSubscription.updateMany({
          where: {
            id: subscription.id,
            status: subscription.status,
            renewsAt: { lte: now },
          },
          data: { status: 'PAST_DUE' },
        });
        status = 'PAST_DUE';
      }

      const entitlements = entitlementsForPlan(subscription.plan.code);
      return {
        status,
        planCode: subscription.plan.code,
        planName: subscription.plan.name,
        renewsAt: subscription.renewsAt,
        isOperational: status === 'ACTIVE' || status === 'TRIAL',
        features: entitlements.features,
        limits: entitlements.limits,
      };
    });
  }

  async requireFeature(feature: SubscriptionFeature) {
    const access = await this.getCurrentAccess();
    if (!access.isOperational) {
      throw new ForbiddenException(
        'اشتراک باشگاه فعال نیست. برای ادامه، اشتراک گُردیار را تمدید کنید.',
      );
    }
    if (!access.features.includes(feature)) {
      throw new ForbiddenException(
        'این قابلیت در پلن فعلی باشگاه فعال نیست. می‌توانید پلن را ارتقا دهید.',
      );
    }
    return access;
  }

  async assertCapacity(resource: SubscriptionLimit, currentCount: number) {
    const access = await this.getCurrentAccess();
    if (!access.isOperational) {
      throw new ForbiddenException(
        'اشتراک باشگاه فعال نیست. برای افزودن اطلاعات جدید، اشتراک را تمدید کنید.',
      );
    }
    const limit = access.limits[resource];
    if (currentCount >= limit) {
      throw new ForbiddenException(
        `سهمیه پلن فعلی تکمیل شده است (${currentCount.toLocaleString('fa-IR')} از ${limit.toLocaleString('fa-IR')}). برای افزایش ظرفیت، پلن را ارتقا دهید.`,
      );
    }
    return access;
  }
}
