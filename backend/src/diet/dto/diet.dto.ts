import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MealInput {
  @IsString() @MinLength(2) @MaxLength(80) mealTime: string;
  @IsString() @MinLength(2) @MaxLength(1000) description: string;
  @IsOptional() @IsInt() @Min(0) @Max(10000) calories?: number;
}

export class CreateDietPlanDto {
  @IsString() athleteUserId: string;
  @IsString() @MinLength(3) @MaxLength(150) title: string;
  @IsOptional() @IsIn(['FAT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'ENDURANCE', 'REHABILITATION'])
  goal?: string;
  @IsOptional() @IsInt() @Min(500) @Max(10000) dailyCalories?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() sourceAISuggestionId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MealInput)
  meals: MealInput[];
}

export class UpdateDietStatusDto {
  @IsIn(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}
