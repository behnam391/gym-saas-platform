import { IsArray, IsOptional, IsString, IsIn, IsNotEmpty } from 'class-validator';

export class ApplyTrainerDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsString()
  @IsNotEmpty({ message: 'بارگذاری مدرک/گواهی الزامی است.' })
  certificateUrl: string;
}

export class ReviewTrainerDto {
  @IsIn(['APPROVED', 'REJECTED'], { message: 'وضعیت نامعتبر است.' })
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class AssignStudentDto {
  @IsString()
  @IsNotEmpty()
  athleteUserId: string;
}
