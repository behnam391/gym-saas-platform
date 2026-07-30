import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { DietService } from './diet.service';
import { CreateDietPlanDto, UpdateDietStatusDto } from './dto/diet.dto';

@Controller('diet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DietController {
  constructor(private readonly dietService: DietService) {}

  @Post()
  @Roles('NUTRITIONIST')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDietPlanDto) {
    return this.dietService.create(user.userId, dto);
  }

  @Get('me')
  @Roles('ATHLETE')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.dietService.listForAthlete(user.userId, true);
  }

  @Get('athlete/:athleteUserId')
  @Roles('NUTRITIONIST', 'GYM_OWNER', 'ATHLETE')
  list(@Param('athleteUserId') athleteUserId: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'ATHLETE' && user.userId !== athleteUserId) {
      throw new ForbiddenException('شما فقط به رژیم‌های خودتان دسترسی دارید.');
    }
    return this.dietService.listForAthlete(athleteUserId, user.role === 'ATHLETE');
  }

  @Patch(':dietPlanId/status')
  @Roles('NUTRITIONIST')
  updateStatus(@Param('dietPlanId') dietPlanId: string, @Body() dto: UpdateDietStatusDto) {
    return this.dietService.updateStatus(dietPlanId, dto);
  }
}
