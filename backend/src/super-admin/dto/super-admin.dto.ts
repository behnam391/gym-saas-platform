import { IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class VerifyTenantDto {
  @IsBoolean()
  isVerified: boolean;
}

export class SetTenantActiveDto {
  @IsBoolean()
  isActive: boolean;
}

export class UpdateIntegrationDto {
  @IsIn(['NOT_CONFIGURED', 'CONFIGURED', 'HEALTHY', 'DEGRADED', 'DISABLED'])
  status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'HEALTHY' | 'DEGRADED' | 'DISABLED';
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsUrl({ require_tld: false }) baseUrl?: string;
  @IsOptional() @IsString() notes?: string;
}

export class AssignSubscriptionDto {
  @IsString() planCode: string;
  @IsIn(['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'])
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
}
