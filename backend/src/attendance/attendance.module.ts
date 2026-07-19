import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { CrowdGateway } from './crowd.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AttendanceController],
  providers: [AttendanceService, CrowdGateway],
})
export class AttendanceModule {}
