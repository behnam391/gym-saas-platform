import { Role } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString({ message: 'موبایل یا کد ملی الزامی است.' })
  @IsNotEmpty({ message: 'موبایل یا کد ملی الزامی است.' })
  identifier: string; // mobile or nationalId

  @IsString({ message: 'رمز عبور الزامی است.' })
  @IsNotEmpty({ message: 'رمز عبور الزامی است.' })
  password: string;

  @IsEnum(Role, { message: 'درگاه ورود نامعتبر است.' })
  expectedRole: Role;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور فعلی الزامی است.' })
  @MaxLength(72, { message: 'رمز عبور فعلی نامعتبر است.' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' })
  @MaxLength(72, { message: 'رمز عبور جدید نمی‌تواند بیشتر از ۷۲ کاراکتر باشد.' })
  newPassword: string;
}
