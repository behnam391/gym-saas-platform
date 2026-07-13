import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TrainersService } from './trainers.service';
import { ApplyTrainerDto, ReviewTrainerDto, AssignStudentDto } from './dto/trainer.dto';

@Controller('trainers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post('apply')
  @Roles('TRAINER')
  apply(@CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyTrainerDto) {
    return this.trainersService.apply(user.userId, dto);
  }

  @Get('pending')
  @Roles('GYM_OWNER')
  listPending() {
    return this.trainersService.listPending();
  }

  @Patch(':trainerProfileId/review')
  @Roles('GYM_OWNER')
  review(
    @Param('trainerProfileId') trainerProfileId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewTrainerDto,
  ) {
    return this.trainersService.review(trainerProfileId, user.userId, dto);
  }

  @Post('students')
  @Roles('TRAINER')
  assignStudent(@CurrentUser() user: AuthenticatedUser, @Body() dto: AssignStudentDto) {
    return this.trainersService.assignStudent(user.userId, dto);
  }

  @Get('students')
  @Roles('TRAINER')
  listStudents(@CurrentUser() user: AuthenticatedUser) {
    return this.trainersService.listStudents(user.userId);
  }
}
