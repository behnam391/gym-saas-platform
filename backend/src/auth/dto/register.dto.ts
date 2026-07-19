import {
  IsString,
  IsNotEmpty,
  IsMobilePhone,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsUUID,
  MinLength,
  Matches,
} from 'class-validator';

export enum GenderDto {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class RegisterDto {
  @IsString({ message: 'نام الزامی است.' })
  @IsNotEmpty({ message: 'نام الزامی است.' })
  firstName: string;

  @IsString({ message: 'نام خانوادگی الزامی است.' })
  @IsNotEmpty({ message: 'نام خانوادگی الزامی است.' })
  lastName: string;

  @Matches(/^\d{10}$/, { message: 'کد ملی باید ۱۰ رقم باشد.' })
  nationalId: string;

  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست.' })
  mobile: string;

  @IsOptional()
  @IsEmail({}, { message: 'ایمیل معتبر نیست.' })
  email?: string;

  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' })
  password: string;

  @IsEnum(GenderDto, { message: 'جنسیت نامعتبر است.' })
  gender: GenderDto;

  @IsDateString({}, { message: 'تاریخ تولد نامعتبر است.' })
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // Required only when the gym marketplace flow targets a specific gym
  // (e.g. "register & request membership at this gym"); null = platform-only signup.
  @IsOptional()
  @IsUUID('4', { message: 'شناسه باشگاه نامعتبر است.' })
  tenantId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'شناسه پلن عضویت نامعتبر است.' })
  membershipPlanId?: string;
}
