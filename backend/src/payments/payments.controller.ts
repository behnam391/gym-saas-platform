import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { RecordManualPaymentDto } from './dto/payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('memberships/:membershipId/manual')
  @Roles('GYM_OWNER', 'RECEPTION')
  recordManual(@Param('membershipId') membershipId: string, @Body() dto: RecordManualPaymentDto) {
    return this.payments.recordManualPayment(membershipId, dto);
  }

  @Get('mine')
  @Roles('ATHLETE')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.payments.listMine(user.userId);
  }

  @Get()
  @Roles('GYM_OWNER', 'RECEPTION')
  listForTenant() {
    return this.payments.listForTenant();
  }

  @Get('summary')
  @Roles('GYM_OWNER')
  summary() {
    return this.payments.summary();
  }
}

