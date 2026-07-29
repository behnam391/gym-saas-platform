import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SuperAdminService } from './super-admin.service';
import {
  AssignSubscriptionDto,
  ListUsersQueryDto,
  SetTenantActiveDto,
  SetUserAccessDto,
  UpdateIntegrationDto,
  SaveIntegrationCredentialsDto,
  VerifyTenantDto,
} from './dto/super-admin.dto';
import { PlatformIntegrationsAdminService } from './platform-integrations-admin.service';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly integrationsAdmin: PlatformIntegrationsAdminService,
  ) {}

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

  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.superAdminService.listUsers(query);
  }

  @Patch('users/:userId/access')
  setUserAccess(@Param('userId') userId: string, @Body() dto: SetUserAccessDto) {
    return this.superAdminService.setUserAccess(userId, dto);
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
    return this.integrationsAdmin.list();
  }

  @Patch('integrations/:key/credentials')
  saveIntegrationCredentials(
    @Param('key') key: string,
    @Body() dto: SaveIntegrationCredentialsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.integrationsAdmin.save(key, dto, user.userId);
  }

  @Post('integrations/:key/test')
  testIntegration(
    @Param('key') key: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.integrationsAdmin.test(key, user.userId);
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
