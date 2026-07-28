import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

enum AttendanceMethodDto {
  QR_CODE = 'QR_CODE',
  MEMBERSHIP_CARD = 'MEMBERSHIP_CARD',
  MANUAL = 'MANUAL',
}

export class CheckInDto {
  @IsString()
  userId: string; // member being checked in (may differ from actor for reception/manual)

  @IsEnum(AttendanceMethodDto, { message: 'روش حضور نامعتبر است.' })
  method: AttendanceMethodDto;

  @IsOptional()
  @IsString()
  membershipId?: string;
}

export class RedeemAttendancePassDto {
  @IsString()
  @MinLength(32)
  token: string;
}
