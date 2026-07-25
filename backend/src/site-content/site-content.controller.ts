import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { SiteContentService } from './site-content.service';

@Controller('site-content')
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  @Get('hero-slides')
  publicHeroSlides() {
    return this.service.publicHeroSlides();
  }

  @Get('admin/hero-slides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  adminHeroSlides() {
    return this.service.adminHeroSlides();
  }

  @Post('admin/hero-slides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  createHeroSlide(@Body() dto: CreateHeroSlideDto) {
    return this.service.createHeroSlide(dto);
  }

  @Patch('admin/hero-slides/:slideId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  updateHeroSlide(@Param('slideId') slideId: string, @Body() dto: UpdateHeroSlideDto) {
    return this.service.updateHeroSlide(slideId, dto);
  }

  @Delete('admin/hero-slides/:slideId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  removeHeroSlide(@Param('slideId') slideId: string) {
    return this.service.removeHeroSlide(slideId);
  }
}
