import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsIn(['GYM', 'TRAINER', 'NUTRITIONIST'])
  targetType: 'GYM' | 'TRAINER' | 'NUTRITIONIST';

  @IsString()
  targetId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
