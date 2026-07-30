import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { MapsService } from './maps.service';

@Controller('maps/public')
@UseGuards(ThrottlerGuard)
export class PublicMapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Post('reverse-geocode')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  reverseGeocode(@Body() dto: ReverseGeocodeDto) {
    return this.mapsService.reverseGeocode(dto);
  }
}
