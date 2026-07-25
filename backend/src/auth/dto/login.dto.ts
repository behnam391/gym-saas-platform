import { Role } from '@prisma/client';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

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
