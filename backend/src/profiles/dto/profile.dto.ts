import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsUrl({ require_tld: false }) profileImageUrl?: string;
}
