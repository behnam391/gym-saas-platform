import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionAccessService } from './subscription-access.service';
import { SubscriptionFeatureGuard } from './subscription-feature.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SubscriptionAccessService, SubscriptionFeatureGuard],
  exports: [SubscriptionAccessService, SubscriptionFeatureGuard],
})
export class SubscriptionsModule {}
