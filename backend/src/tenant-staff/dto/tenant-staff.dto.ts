import { Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { GenderDto } from '../../auth/dto/register.dto';

export class CreateTenantStaffDto {
  @IsEnum(Role)
  role: 'RECEPTION' | 'BUFFET_STAFF' | 'TRAINER' | 'NUTRITIONIST';

  @IsString() @MaxLength(80)
  firstName: string;

  @IsString() @MaxLength(100)
  lastName: string;

  @Matches(/^\d{10}$/, { message: 'کد ملی باید ۱۰ رقم باشد.' })
  nationalId: string;

  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست.' })
  mobile: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsEnum(GenderDto)
  gender: GenderDto;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  specialties?: string[];

  @IsOptional() @IsString() @MaxLength(500)
  bio?: string;
}

export class SetTenantStaffAccessDto {
  @IsBoolean()
  isActive: boolean;
}
