import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlatformProfessionalDto {
  @IsIn(['TRAINER', 'NUTRITIONIST'])
  type: 'TRAINER' | 'NUTRITIONIST';

  @IsString() @MaxLength(150)
  fullName: string;

  @IsOptional() @IsUrl({ require_tld: false })
  profileImageUrl?: string;

  @IsOptional() @IsString() @MaxLength(1500)
  bio?: string;

  @IsArray() @IsString({ each: true })
  specialties: string[];

  @IsOptional() @IsString() @MaxLength(80)
  province?: string;

  @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @IsIn(['ONLINE', 'IN_PERSON', 'HYBRID'])
  serviceMode: 'ONLINE' | 'IN_PERSON' | 'HYBRID';

  @IsOptional() @IsNumber() @Min(0)
  consultationFee?: number;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;
}

export class SetPlatformProfessionalAccessDto {
  @IsBoolean()
  isActive: boolean;
}

export class CreateConsultationRequestDto {
  @IsOptional() @IsDateString()
  preferredAt?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  message?: string;
}

export class UpdateConsultationStatusDto {
  @IsIn(['REQUESTED', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
  status:
    | 'REQUESTED'
    | 'CONTACTED'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED';
}
