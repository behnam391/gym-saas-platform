import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateOnboardingApplicationDto,
  ReviewOnboardingApplicationDto,
} from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Post('applications')
  @Throttle({ default: { limit: 3, ttl: 10 * 60_000 } })
  create(@Body() dto: CreateOnboardingApplicationDto) {
    return this.service.create(dto);
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  list() {
    return this.service.list();
  }

  @Patch('applications/:applicationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  review(
    @Param('applicationId') applicationId: string,
    @Body() dto: ReviewOnboardingApplicationDto,
  ) {
    return this.service.review(applicationId, dto);
  }
}
