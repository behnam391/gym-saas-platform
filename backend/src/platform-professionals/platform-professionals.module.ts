import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformProfessionalsController } from './platform-professionals.controller';
import { PlatformProfessionalsService } from './platform-professionals.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformProfessionalsController],
  providers: [PlatformProfessionalsService],
})
export class PlatformProfessionalsModule {}
