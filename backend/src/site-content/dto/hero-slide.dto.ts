import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHeroSlideDto {
  @IsOptional() @IsString() @MaxLength(100)
  eyebrow?: string;

  @IsString() @MaxLength(180)
  title: string;

  @IsOptional() @IsString() @MaxLength(600)
  subtitle?: string;

  @Matches(/^(https?:\/\/|\/)/, { message: 'آدرس تصویر باید لینک کامل یا مسیر داخلی باشد.' })
  imageUrl: string;

  @IsOptional() @IsString() @MaxLength(250)
  imageCredit?: string;

  @IsOptional() @IsString() @MaxLength(80)
  ctaLabel?: string;

  @IsOptional() @Matches(/^(https?:\/\/|\/)/, { message: 'آدرس دکمه باید لینک کامل یا مسیر داخلی باشد.' })
  ctaUrl?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

export class UpdateHeroSlideDto {
  @IsOptional() @IsString() @MaxLength(100)
  eyebrow?: string;

  @IsOptional() @IsString() @MaxLength(180)
  title?: string;

  @IsOptional() @IsString() @MaxLength(600)
  subtitle?: string;

  @IsOptional() @Matches(/^(https?:\/\/|\/)/, { message: 'آدرس تصویر باید لینک کامل یا مسیر داخلی باشد.' })
  imageUrl?: string;

  @IsOptional() @IsString() @MaxLength(250)
  imageCredit?: string;

  @IsOptional() @IsString() @MaxLength(80)
  ctaLabel?: string;

  @IsOptional() @Matches(/^(https?:\/\/|\/)/, { message: 'آدرس دکمه باید لینک کامل یا مسیر داخلی باشد.' })
  ctaUrl?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}
