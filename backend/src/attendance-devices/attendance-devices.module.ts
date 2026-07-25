import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceDevicesController } from './attendance-devices.controller';
import { AttendanceDevicesService } from './attendance-devices.service';

@Module({ imports: [PrismaModule], controllers: [AttendanceDevicesController], providers: [AttendanceDevicesService] })
export class AttendanceDevicesModule {}
