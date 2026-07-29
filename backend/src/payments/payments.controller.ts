import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import {
  FinanceDashboardQueryDto,
  RecordManualPaymentDto,
  StartPlatformSubscriptionPaymentDto,
} from './dto/payment.dto';
import { SubscriptionFeatureGuard } from '../subscriptions/subscription-feature.guard';
import { RequiresSubscriptionFeature } from '../subscriptions/requires-subscription-feature.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('memberships/:membershipId/manual')
  @Roles('GYM_OWNER', 'RECEPTION')
  recordManual(@Param('membershipId') membershipId: string, @Body() dto: RecordManualPaymentDto) {
    return this.payments.recordManualPayment(membershipId, dto);
  }

  @Post('memberships/:membershipId/zarinpal')
  @Roles('ATHLETE')
  startZarinpal(
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payments.startZarinpalPayment(membershipId, user.userId);
  }

  @Get('mine')
  @Roles('ATHLETE')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.payments.listMine(user.userId);
  }

  @Get('platform-subscription')
  @Roles('GYM_OWNER')
  platformSubscription() {
    return this.payments.platformSubscriptionOverview();
  }

  @Post('platform-subscription/zarinpal')
  @Roles('GYM_OWNER')
  startPlatformSubscriptionPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartPlatformSubscriptionPaymentDto,
  ) {
    return this.payments.startPlatformSubscriptionPayment(user, dto);
  }

  @Get('summary')
  @Roles('GYM_OWNER')
  summary() {
    return this.payments.summary();
  }

  @Get('dashboard')
  @UseGuards(SubscriptionFeatureGuard)
  @Roles('GYM_OWNER')
  @RequiresSubscriptionFeature('FINANCE_REPORTS')
  dashboard(@Query() query: FinanceDashboardQueryDto) {
    return this.payments.dashboard(query);
  }

  @Get()
  @Roles('GYM_OWNER', 'RECEPTION')
  listForTenant() {
    return this.payments.listForTenant();
  }
}
