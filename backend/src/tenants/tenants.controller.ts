import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';
import {
  SearchTenantsDto,
  UpdateTenantProfileDto,
  CreateMembershipPlanDto,
  ReviewInsuranceDto,
  ReviewParentalConsentDto,
} from './dto/tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ---- Public marketplace (no auth) ----

  @Get()
  search(@Query() dto: SearchTenantsDto) {
    return this.tenantsService.search(dto);
  }

  @Get(':slug')
  getPublicProfile(@Param('slug') slug: string) {
    return this.tenantsService.getPublicProfile(slug);
  }

  // ---- Gym Owner management (auth + RBAC) ----

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  updateMyProfile(@Body() dto: UpdateTenantProfileDto) {
    return this.tenantsService.updateMyProfile(dto);
  }

  @Post('me/membership-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  createMembershipPlan(@Body() dto: CreateMembershipPlanDto) {
    return this.tenantsService.createMembershipPlan(dto);
  }

  @Get('me/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  listMembers() {
    return this.tenantsService.listMembers();
  }

  @Patch('me/insurance/:documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  reviewInsurance(
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewInsuranceDto,
  ) {
    return this.tenantsService.reviewInsurance(documentId, user.userId, dto);
  }

  @Patch('me/parental-consent/:consentUserId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  reviewParentalConsent(
    @Param('consentUserId') consentUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewParentalConsentDto,
  ) {
    return this.tenantsService.reviewParentalConsent(consentUserId, user.userId, dto);
  }
}
