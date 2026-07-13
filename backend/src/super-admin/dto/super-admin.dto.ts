import { IsBoolean, IsOptional } from 'class-validator';

export class VerifyTenantDto {
  @IsBoolean()
  isVerified: boolean;
}

export class SetTenantActiveDto {
  @IsBoolean()
  isActive: boolean;
}
