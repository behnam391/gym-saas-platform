import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateConsultationRequestDto,
  CreatePlatformProfessionalDto,
  SetPlatformProfessionalAccessDto,
} from './dto/platform-professional.dto';
import { PlatformProfessionalsService } from './platform-professionals.service';

@Controller('platform-professionals')
export class PlatformProfessionalsController {
  constructor(private readonly service: PlatformProfessionalsService) {}

  @Get()
  list(@Query('type') type?: string) {
    if (type && type !== 'TRAINER' && type !== 'NUTRITIONIST') {
      throw new BadRequestException('نوع متخصص نامعتبر است.');
    }
    return this.service.publicList(type as 'TRAINER' | 'NUTRITIONIST' | undefined);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ATHLETE')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.mine(user.userId);
  }

  @Post(':professionalId/consultations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ATHLETE')
  request(
    @CurrentUser() user: AuthenticatedUser,
    @Param('professionalId') professionalId: string,
    @Body() dto: CreateConsultationRequestDto,
  ) {
    return this.service.requestConsultation(user.userId, professionalId, dto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  adminList() {
    return this.service.adminList();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreatePlatformProfessionalDto) {
    return this.service.create(dto);
  }

  @Patch('admin/:professionalId/access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  setAccess(
    @Param('professionalId') professionalId: string,
    @Body() dto: SetPlatformProfessionalAccessDto,
  ) {
    return this.service.setAccess(professionalId, dto);
  }
}
