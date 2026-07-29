import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export enum OtpChannelDto {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum OtpPurposeDto {
  REGISTER = 'REGISTER',
  ONBOARDING = 'ONBOARDING',
  RESET_PASSWORD = 'RESET_PASSWORD',
  LOGIN = 'LOGIN',
}

export class RequestOtpDto {
  @IsEnum(OtpChannelDto)
  channel: OtpChannelDto;

  @IsEnum(OtpPurposeDto)
  purpose: OtpPurposeDto;

  @IsString()
  destination: string;
}

export class VerifyOtpDto {
  @IsUUID('4')
  challengeId: string;

  @Matches(/^\d{6}$/, { message: 'کد تأیید باید ۶ رقم باشد.' })
  code: string;
}

export class ResetPasswordDto {
  @IsString()
  verificationToken: string;

  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' })
  newPassword: string;
}

export class OtpLoginDto {
  @IsString()
  verificationToken: string;

  @IsIn(Object.values(Role))
  expectedRole: Role;
}
