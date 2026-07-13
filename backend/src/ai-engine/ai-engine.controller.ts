import { Body, Controller, Get, Param, Patch, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AiEngineService } from './ai-engine.service';
import { GenerateSuggestionDto, ReviewSuggestionDto } from './dto/ai-engine.dto';

@Controller('ai-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiEngineController {
  constructor(private readonly aiEngineService: AiEngineService) {}

  @Post('generate')
  @Roles('TRAINER', 'NUTRITIONIST', 'GYM_OWNER')
  generate(@Body() dto: GenerateSuggestionDto) {
    return this.aiEngineService.generate(dto);
  }

  @Get('athlete/:athleteUserId')
  @Roles('TRAINER', 'NUTRITIONIST', 'GYM_OWNER', 'ATHLETE')
  list(@Param('athleteUserId') athleteUserId: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'ATHLETE' && user.userId !== athleteUserId) {
      throw new ForbiddenException('شما فقط به اطلاعات خودتان دسترسی دارید.');
    }
    return this.aiEngineService.listForAthlete(athleteUserId, user.role);
  }

  @Patch(':suggestionId/review')
  @Roles('TRAINER', 'NUTRITIONIST')
  review(
    @Param('suggestionId') suggestionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewSuggestionDto,
  ) {
    return this.aiEngineService.review(suggestionId, user.userId, user.role, dto);
  }
}
