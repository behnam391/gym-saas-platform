import { SetMetadata } from '@nestjs/common';
import { SubscriptionFeature } from './subscription-entitlements';

export const SUBSCRIPTION_FEATURE_KEY = 'gordyar:subscription-feature';

export const RequiresSubscriptionFeature = (feature: SubscriptionFeature) =>
  SetMetadata(SUBSCRIPTION_FEATURE_KEY, feature);
