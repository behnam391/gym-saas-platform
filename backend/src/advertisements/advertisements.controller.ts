import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AdvertisementsService } from './advertisements.service';
import { AdvertisementQueryDto, CreateAdvertisementDto, ReviewAdvertisementDto } from './dto/advertisement.dto';

@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly service: AdvertisementsService) {}

  @Get('public')
  listPublic(@Query() query: AdvertisementQueryDto) { return this.service.listPublic(query); }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  listMine() { return this.service.listMine(); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  create(@Body() dto: CreateAdvertisementDto) { return this.service.create(dto); }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  listForReview() { return this.service.listForReview(); }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  review(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ReviewAdvertisementDto) {
    return this.service.review(id, user.userId, dto);
  }
}
