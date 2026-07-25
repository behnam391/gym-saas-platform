import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';
import {
  SearchTenantsDto,
  UpdateTenantProfileDto,
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
  ReviewInsuranceDto,
  ReviewParentalConsentDto,
  AddTenantGalleryImageDto,
} from './dto/tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ---- Public marketplace (no auth) ----

  @Get()
  search(@Query() dto: SearchTenantsDto) {
    return this.tenantsService.search(dto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  getMyProfile() {
    return this.tenantsService.getMyProfile();
  }

  @Post('me/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  addGalleryImage(@Body() dto: AddTenantGalleryImageDto) {
    return this.tenantsService.addGalleryImage(dto);
  }

  @Delete('me/gallery/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  removeGalleryImage(@Param('imageId') imageId: string) {
    return this.tenantsService.removeGalleryImage(imageId);
  }

  @Get('me/membership-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  listMembershipPlans() {
    return this.tenantsService.listMembershipPlans();
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

  @Patch('me/membership-plans/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  updateMembershipPlan(@Param('planId') planId: string, @Body() dto: UpdateMembershipPlanDto) {
    return this.tenantsService.updateMembershipPlan(planId, dto);
  }

  @Delete('me/membership-plans/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  archiveMembershipPlan(@Param('planId') planId: string) {
    return this.tenantsService.archiveMembershipPlan(planId);
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
