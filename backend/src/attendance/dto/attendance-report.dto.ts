import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ATTENDANCE_METHODS = [
  'QR_CODE',
  'MEMBERSHIP_CARD',
  'MANUAL',
  'FINGERPRINT',
  'FACE_RECOGNITION',
  'NFC_PHONE',
] as const;

export class AttendanceReportQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'تاریخ شروع نامعتبر است.' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاریخ پایان نامعتبر است.' })
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(ATTENDANCE_METHODS, { message: 'روش ورود نامعتبر است.' })
  method?: (typeof ATTENDANCE_METHODS)[number];

  @IsOptional()
  @IsIn(['OPEN', 'COMPLETED'], { message: 'وضعیت حضور نامعتبر است.' })
  status?: 'OPEN' | 'COMPLETED';
}
