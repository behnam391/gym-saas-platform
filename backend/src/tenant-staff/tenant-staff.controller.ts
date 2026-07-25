import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateTenantStaffDto,
  SetTenantStaffAccessDto,
} from './dto/tenant-staff.dto';
import { TenantStaffService } from './tenant-staff.service';

@Controller('tenant-staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GYM_OWNER')
export class TenantStaffController {
  constructor(private readonly service: TenantStaffService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTenantStaffDto) {
    return this.service.create(user.userId, dto);
  }

  @Patch(':staffId/access')
  setAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId') staffId: string,
    @Body() dto: SetTenantStaffAccessDto,
  ) {
    return this.service.setAccess(user.userId, staffId, dto);
  }
}
