import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { MapsService } from './maps.service';

@Controller('maps')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GYM_OWNER', 'SUPER_ADMIN')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('browser-config')
  browserConfig() {
    return this.mapsService.browserConfig();
  }

  @Post('reverse-geocode')
  reverseGeocode(@Body() dto: ReverseGeocodeDto) {
    return this.mapsService.reverseGeocode(dto);
  }
}
