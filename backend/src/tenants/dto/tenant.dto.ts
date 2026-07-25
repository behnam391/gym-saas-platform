import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchTenantsDto {
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxDistanceKm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minRating?: number;
  @IsOptional() @IsIn(['MALE', 'FEMALE']) gender?: 'MALE' | 'FEMALE';
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];
}

export class UpdateTenantProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() workingHours?: Record<string, unknown>;
  @IsOptional() socialLinks?: Record<string, unknown>;
}

export class AddTenantGalleryImageDto {
  @IsUrl({ require_tld: false }) url: string;
  @IsOptional() @IsIn(['image', 'video']) type?: 'image' | 'video';
}

export class CreateMembershipPlanDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(1) durationDays: number;
  @IsNumber() @Min(0) price: number;
}

export class UpdateMembershipPlanDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(1) durationDays?: number;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReviewInsuranceDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
  @IsOptional() @IsString() rejectionReason?: string;
}

export class ReviewParentalConsentDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
  @IsOptional() @IsString() rejectionReason?: string;
}
