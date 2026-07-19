import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AthletesService } from './athletes.service';
import {
  CreateBodyMeasurementDto,
  CreateGoalDto,
  SubmitInsuranceDto,
  SubmitParentalConsentDto,
  UpdateAthleteProfileDto,
  UpdateGoalDto,
} from './dto/athlete.dto';

@Controller('athletes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ATHLETE')
export class AthletesController {
  constructor(private readonly athletes: AthletesService) {}

  @Get('me/profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.athletes.getProfile(user.userId);
  }

  @Patch('me/profile')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAthleteProfileDto) {
    return this.athletes.updateProfile(user.userId, dto);
  }

  @Get('me/measurements')
  listMeasurements(@CurrentUser() user: AuthenticatedUser) {
    return this.athletes.listMeasurements(user.userId);
  }

  @Post('me/measurements')
  addMeasurement(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBodyMeasurementDto) {
    return this.athletes.addMeasurement(user.userId, dto);
  }

  @Get('me/goals')
  listGoals(@CurrentUser() user: AuthenticatedUser) {
    return this.athletes.listGoals(user.userId);
  }

  @Post('me/goals')
  createGoal(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGoalDto) {
    return this.athletes.createGoal(user.userId, dto);
  }

  @Patch('me/goals/:goalId')
  updateGoal(@CurrentUser() user: AuthenticatedUser, @Param('goalId') goalId: string, @Body() dto: UpdateGoalDto) {
    return this.athletes.updateGoal(user.userId, goalId, dto);
  }

  @Get('me/memberships')
  listMemberships(@CurrentUser() user: AuthenticatedUser) {
    return this.athletes.listMemberships(user.userId);
  }

  @Get('me/payments')
  listPayments(@CurrentUser() user: AuthenticatedUser) {
    return this.athletes.listPayments(user.userId);
  }

  @Get('me/attendance')
  listAttendance(@CurrentUser() user: AuthenticatedUser) {
    return this.athletes.listAttendance(user.userId);
  }

  @Get('me/progress')
  getProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.athletes.getProgress(user.userId);
  }

  @Post('me/insurance')
  submitInsurance(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitInsuranceDto) {
    return this.athletes.submitInsurance(user.userId, dto);
  }

  @Post('me/parental-consent')
  submitParentalConsent(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitParentalConsentDto) {
    return this.athletes.submitParentalConsent(user.userId, dto);
  }
}

