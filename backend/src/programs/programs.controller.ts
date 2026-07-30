import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramStatusDto } from './dto/program.dto';

@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles('TRAINER')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProgramDto) {
    return this.programsService.create(user.userId, dto);
  }

  @Get('me')
  @Roles('ATHLETE')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.programsService.listForAthlete(user.userId, true);
  }

  @Get('athlete/:athleteUserId')
  @Roles('TRAINER', 'GYM_OWNER', 'ATHLETE')
  list(@Param('athleteUserId') athleteUserId: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'ATHLETE' && user.userId !== athleteUserId) {
      throw new ForbiddenException('شما فقط به برنامه‌های خودتان دسترسی دارید.');
    }
    return this.programsService.listForAthlete(athleteUserId, user.role === 'ATHLETE');
  }

  @Patch(':programId/status')
  @Roles('TRAINER')
  updateStatus(@Param('programId') programId: string, @Body() dto: UpdateProgramStatusDto) {
    return this.programsService.updateStatus(programId, dto);
  }
}
