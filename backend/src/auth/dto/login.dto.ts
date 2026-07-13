import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'موبایل یا کد ملی الزامی است.' })
  @IsNotEmpty({ message: 'موبایل یا کد ملی الزامی است.' })
  identifier: string; // mobile or nationalId

  @IsString({ message: 'رمز عبور الزامی است.' })
  @IsNotEmpty({ message: 'رمز عبور الزامی است.' })
  password: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
