import { Module } from '@nestjs/common';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { PublicMapsController } from './public-maps.controller';

@Module({
  controllers: [MapsController, PublicMapsController],
  providers: [MapsService],
})
export class MapsModule {}
