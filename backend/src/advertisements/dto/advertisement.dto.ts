import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class AdvertisementQueryDto {
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() city?: string;
}

export class CreateAdvertisementDto {
  @IsString() @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
  @IsOptional() @IsUrl({ require_tld: false }) destinationUrl?: string;
  @IsString() @MaxLength(80) province: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) dailyBudget?: number;
}

export class ReviewAdvertisementDto {
  @IsIn(['APPROVED', 'REJECTED', 'PAUSED'])
  status: 'APPROVED' | 'REJECTED' | 'PAUSED';
  @IsOptional() @IsString() @MaxLength(500) rejectionReason?: string;
}
