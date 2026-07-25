import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SuperAdminService } from './super-admin.service';
import { VerifyTenantDto, SetTenantActiveDto, UpdateIntegrationDto, AssignSubscriptionDto } from './dto/super-admin.dto';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('overview')
  overview() {
    return this.superAdminService.platformOverview();
  }

  @Get('tenants')
  listTenants() {
    return this.superAdminService.listTenants();
  }

  @Patch('tenants/:tenantId/verify')
  verifyTenant(@Param('tenantId') tenantId: string, @Body() dto: VerifyTenantDto) {
    return this.superAdminService.verifyTenant(tenantId, dto);
  }

  @Patch('tenants/:tenantId/active')
  setTenantActive(@Param('tenantId') tenantId: string, @Body() dto: SetTenantActiveDto) {
    return this.superAdminService.setTenantActive(tenantId, dto);
  }

  @Get('rankings')
  rankings() {
    return this.superAdminService.rankings();
  }

  @Get('financial-summary')
  financialSummary() {
    return this.superAdminService.financialSummary();
  }

  @Get('tickets')
  listAllTickets() {
    return this.superAdminService.listAllTickets();
  }

  @Get('integrations')
  listIntegrations() {
    return this.superAdminService.listIntegrations();
  }

  @Patch('integrations/:key')
  updateIntegration(@Param('key') key: string, @Body() dto: UpdateIntegrationDto) {
    return this.superAdminService.updateIntegration(key, dto);
  }

  @Get('subscriptions')
  subscriptions() {
    return this.superAdminService.listSubscriptions();
  }

  @Patch('subscriptions/:tenantId')
  assignSubscription(@Param('tenantId') tenantId: string, @Body() dto: AssignSubscriptionDto) {
    return this.superAdminService.assignSubscription(tenantId, dto);
  }
}
