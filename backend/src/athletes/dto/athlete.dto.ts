import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const FITNESS_GOALS = ['FAT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'ENDURANCE', 'REHABILITATION'] as const;
const TRAINING_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE'] as const;

export class UpdateAthleteProfileDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(50) @Max(260) heightCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(20) @Max(400) weightKg?: number;
  @IsOptional() @IsString() trainingHistory?: string;
  @IsOptional() @IsString() injuries?: string;
  @IsOptional() @IsString() illnesses?: string;
  @IsOptional() @IsString() medications?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsIn(FITNESS_GOALS) fitnessGoal?: (typeof FITNESS_GOALS)[number];
  @IsOptional() @IsIn(TRAINING_LEVELS) trainingLevel?: (typeof TRAINING_LEVELS)[number];
  @IsOptional() @IsString() activityLevel?: string;
}

export class CreateBodyMeasurementDto {
  @IsOptional() @IsDateString() recordedAt?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(20) @Max(400) weightKg?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(20) @Max(300) waistCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(20) @Max(300) chestCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(10) @Max(150) armCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(10) @Max(200) thighCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(10) @Max(150) calfCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(10) @Max(150) neckCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(20) @Max(300) shoulderCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(80) bodyFatPercent?: number;
}

export class CreateGoalDto {
  @IsIn(FITNESS_GOALS) type: (typeof FITNESS_GOALS)[number];
  @IsOptional() @Type(() => Number) @IsNumber() targetValue?: number;
  @IsOptional() @IsDateString() targetDate?: string;
}

export class UpdateGoalDto {
  @IsOptional() @Type(() => Number) @IsNumber() targetValue?: number;
  @IsOptional() @IsDateString() targetDate?: string;
  @IsOptional() @IsBoolean() achieved?: boolean;
}

export class SubmitInsuranceDto {
  @IsUrl({ require_tld: false }, { message: 'آدرس فایل بیمه معتبر نیست.' }) documentUrl: string;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() policyNumber?: string;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validUntil?: string;
}

export class SubmitParentalConsentDto {
  @IsString()
  @Length(3, 120, { message: 'نام ولی باید بین ۳ تا ۱۲۰ نویسه باشد.' })
  guardianName: string;

  @Matches(/^\d{10}$/, { message: 'کد ملی ولی باید ۱۰ رقم باشد.' })
  guardianNationalId: string;

  @Matches(/^09\d{9}$/, { message: 'شماره موبایل ولی معتبر نیست.' })
  guardianMobile: string;

  @IsUrl({ require_tld: false }, { message: 'آدرس فایل رضایت‌نامه معتبر نیست.' }) documentUrl: string;
}

export class RequestMembershipDto {
  @IsUUID() tenantId: string;
  @IsUUID() planId: string;
}
