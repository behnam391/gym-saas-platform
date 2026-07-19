import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AthletesController } from './athletes.controller';
import { AthletesService } from './athletes.service';

@Module({
  imports: [PrismaModule],
  controllers: [AthletesController],
  providers: [AthletesService],
})
export class AthletesModule {}

