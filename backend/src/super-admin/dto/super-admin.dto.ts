import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

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

export class SaveIntegrationCredentialsDto {
  @IsOptional()
  @IsUUID()
  merchantId?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  apiKey?: string;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'نام قالب OTP فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.',
  })
  otpTemplate?: string;

  @IsOptional()
  @Matches(/^(09\d{9})(\s*,\s*09\d{9})*$/, {
    message: 'شماره‌های مجاز باید با ۰۹ شروع شوند و با ویرگول جدا شوند.',
  })
  allowedRecipients?: string;

  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  callbackUrl?: string;
}

export class AssignSubscriptionDto {
  @IsString() planCode: string;
  @IsIn(['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'])
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
}

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'GYM_OWNER', 'TRAINER', 'NUTRITIONIST', 'RECEPTION', 'BUFFET_STAFF', 'ATHLETE'])
  role?: 'SUPER_ADMIN' | 'GYM_OWNER' | 'TRAINER' | 'NUTRITIONIST' | 'RECEPTION' | 'BUFFET_STAFF' | 'ATHLETE';
}

export class SetUserAccessDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isRestricted?: boolean;
}
