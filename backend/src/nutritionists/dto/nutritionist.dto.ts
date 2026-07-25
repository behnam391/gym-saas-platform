import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApplyNutritionistDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsString()
  @IsNotEmpty({ message: 'تصویر کارت ملی الزامی است.' })
  nationalIdDocUrl: string;

  @IsString()
  @IsNotEmpty({ message: 'گواهی تخصصی الزامی است.' })
  certificateUrl: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}

export class ReviewNutritionistDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class AssignClientDto {
  @IsString()
  @IsNotEmpty()
  athleteUserId: string;
}
