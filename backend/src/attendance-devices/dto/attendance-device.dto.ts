import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const DEVICE_TYPES = ['CARD', 'FINGERPRINT', 'FACE_RECOGNITION', 'NFC_PHONE'] as const;

export class CreateAttendanceDeviceDto {
  @IsString() @MaxLength(100) name: string;
  @IsIn(DEVICE_TYPES) type: typeof DEVICE_TYPES[number];
  @IsOptional() @IsString() @MaxLength(100) vendor?: string;
  @IsOptional() @IsString() @MaxLength(100) model?: string;
  @IsOptional() @IsString() @MaxLength(120) serialNumber?: string;
}

export class CreateAttendanceCredentialDto {
  @IsUUID() userId: string;
  @IsIn(DEVICE_TYPES) type: typeof DEVICE_TYPES[number];
  @IsString() @MaxLength(250) identifier: string;
  @IsOptional() @IsString() @MaxLength(100) label?: string;
}

export class DeviceAttendanceEventDto {
  @IsIn(DEVICE_TYPES) type: typeof DEVICE_TYPES[number];
  @IsString() @MaxLength(250) identifier: string;
  @IsIn(['CHECK_IN', 'CHECK_OUT']) action: 'CHECK_IN' | 'CHECK_OUT';
}
