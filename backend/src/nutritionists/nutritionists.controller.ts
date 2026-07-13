import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NutritionistsService } from './nutritionists.service';
import { ApplyNutritionistDto, ReviewNutritionistDto } from './dto/nutritionist.dto';

@Controller('nutritionists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NutritionistsController {
  constructor(private readonly nutritionistsService: NutritionistsService) {}

  @Post('apply')
  @Roles('NUTRITIONIST')
  apply(@CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyNutritionistDto) {
    return this.nutritionistsService.apply(user.userId, dto);
  }

  @Get('pending')
  @Roles('SUPER_ADMIN')
  listPending() {
    return this.nutritionistsService.listPendingPlatformWide();
  }

  @Patch(':nutritionistProfileId/review')
  @Roles('SUPER_ADMIN')
  review(
    @Param('nutritionistProfileId') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewNutritionistDto,
  ) {
    return this.nutritionistsService.review(id, user.userId, dto);
  }
}
