import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateProfessionalContractDto,
  CreateProfessionalSettlementDto,
  MarkProfessionalSettlementPaidDto,
  SetProfessionalContractStatusDto,
} from './dto/professional-finance.dto';
import { ProfessionalFinanceService } from './professional-finance.service';

@Controller('professional-finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GYM_OWNER')
export class ProfessionalFinanceController {
  constructor(private readonly service: ProfessionalFinanceService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Post('contracts')
  createContract(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfessionalContractDto,
  ) {
    return this.service.createContract(user.userId, dto);
  }

  @Patch('contracts/:contractId/status')
  setContractStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() dto: SetProfessionalContractStatusDto,
  ) {
    return this.service.setContractStatus(user.userId, contractId, dto);
  }

  @Post('contracts/:contractId/settlements')
  createSettlement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() dto: CreateProfessionalSettlementDto,
  ) {
    return this.service.createSettlement(user.userId, contractId, dto);
  }

  @Patch('settlements/:settlementId/pay')
  markPaid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('settlementId', ParseUUIDPipe) settlementId: string,
    @Body() dto: MarkProfessionalSettlementPaidDto,
  ) {
    return this.service.markSettlementPaid(user.userId, settlementId, dto);
  }
}
