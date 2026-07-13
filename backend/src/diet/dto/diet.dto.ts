import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MealInput {
  @IsString() mealTime: string;
  @IsString() description: string;
  @IsOptional() calories?: number;
}

export class CreateDietPlanDto {
  @IsString() athleteUserId: string;
  @IsString() title: string;
  @IsOptional() @IsIn(['FAT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'ENDURANCE', 'REHABILITATION'])
  goal?: string;
  @IsOptional() dailyCalories?: number;
  @IsOptional() @IsString() sourceAISuggestionId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MealInput)
  meals: MealInput[];
}

export class UpdateDietStatusDto {
  @IsIn(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}
