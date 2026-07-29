import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AttendanceDevicesService } from './attendance-devices.service';
import {
  CreateAttendanceCredentialDto,
  CreateAttendanceDeviceDto,
  DeviceAttendanceEventDto,
  SetAttendanceCredentialStatusDto,
  SetAttendanceDeviceStatusDto,
} from './dto/attendance-device.dto';
import { SubscriptionFeatureGuard } from '../subscriptions/subscription-feature.guard';
import { RequiresSubscriptionFeature } from '../subscriptions/requires-subscription-feature.decorator';

@Controller('attendance-devices')
export class AttendanceDevicesController {
  constructor(private readonly service: AttendanceDevicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER')
  list() { return this.service.list(); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionFeatureGuard)
  @Roles('GYM_OWNER')
  @RequiresSubscriptionFeature('DEVICE_INTEGRATION')
  create(@Body() dto: CreateAttendanceDeviceDto) { return this.service.create(dto); }

  @Patch(':deviceId/status')
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionFeatureGuard)
  @Roles('GYM_OWNER')
  @RequiresSubscriptionFeature('DEVICE_INTEGRATION')
  setStatus(@Param('deviceId') deviceId: string, @Body() dto: SetAttendanceDeviceStatusDto) {
    return this.service.setStatus(deviceId, dto);
  }

  @Post('credentials')
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionFeatureGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  @RequiresSubscriptionFeature('DEVICE_INTEGRATION')
  addCredential(@Body() dto: CreateAttendanceCredentialDto) { return this.service.addCredential(dto); }

  @Get('credentials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  listCredentials() { return this.service.listCredentials(); }

  @Patch('credentials/:credentialId/status')
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionFeatureGuard)
  @Roles('GYM_OWNER', 'RECEPTION')
  @RequiresSubscriptionFeature('DEVICE_INTEGRATION')
  setCredentialStatus(
    @Param('credentialId') credentialId: string,
    @Body() dto: SetAttendanceCredentialStatusDto,
  ) {
    return this.service.setCredentialStatus(credentialId, dto);
  }

  @Post('events')
  ingest(@Headers('x-device-key') apiKey: string | undefined, @Body() dto: DeviceAttendanceEventDto) {
    return this.service.ingest(apiKey, dto);
  }
}
