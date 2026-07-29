import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionAccessService } from './subscription-access.service';
import { SubscriptionFeature } from './subscription-entitlements';
import { SUBSCRIPTION_FEATURE_KEY } from './requires-subscription-feature.decorator';

@Injectable()
export class SubscriptionFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: SubscriptionAccessService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const feature = this.reflector.getAllAndOverride<SubscriptionFeature>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;
    await this.access.requireFeature(feature);
    return true;
  }
}
