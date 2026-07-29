import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const APPLICATION_TYPES = ['GYM_OWNER', 'TRAINER', 'NUTRITIONIST'] as const;

export class CreateOnboardingApplicationDto {
  @IsString()
  verificationToken: string;

  @IsIn(APPLICATION_TYPES)
  type: typeof APPLICATION_TYPES[number];

  @IsString() @MaxLength(80)
  firstName: string;

  @IsString() @MaxLength(100)
  lastName: string;

  @Matches(/^\d{10}$/, { message: 'کد ملی باید ۱۰ رقم باشد.' })
  nationalId: string;

  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست.' })
  mobile: string;

  @IsOptional() @IsEmail({}, { message: 'ایمیل معتبر نیست.' })
  email?: string;

  @IsOptional() @IsString() @MaxLength(80)
  province?: string;

  @IsString() @MaxLength(80)
  city: string;

  @IsOptional() @IsString() @MaxLength(300)
  address?: string;

  @IsOptional() @IsString() @MaxLength(150)
  gymName?: string;

  @IsOptional() @IsString() @MaxLength(200)
  specialty?: string;

  @IsOptional() @IsString() @MaxLength(100)
  licenseNumber?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

export class ReviewOnboardingApplicationDto {
  @IsIn(['UNDER_REVIEW', 'APPROVED', 'REJECTED'])
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

  @IsOptional() @IsString() @MaxLength(1000)
  reviewNotes?: string;
}
