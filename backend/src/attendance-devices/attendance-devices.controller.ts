import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AttendanceDevicesService } from './attendance-devices.service';
import { CreateAttendanceCredentialDto, CreateAttendanceDeviceDto, DeviceAttendanceEventDto } from './dto/attendance-device.dto';

@Controller('attendance-devices')
export class AttendanceDevicesController {
  constructor(private readonly service: AttendanceDevicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  list() { return this.service.list(); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  create(@Body() dto: CreateAttendanceDeviceDto) { return this.service.create(dto); }

  @Post('credentials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  addCredential(@Body() dto: CreateAttendanceCredentialDto) { return this.service.addCredential(dto); }

  @Post('events')
  ingest(@Headers('x-device-key') apiKey: string | undefined, @Body() dto: DeviceAttendanceEventDto) {
    return this.service.ingest(apiKey, dto);
  }
}
