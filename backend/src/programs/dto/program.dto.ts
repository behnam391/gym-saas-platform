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

class ExerciseInput {
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) sets?: number;
  @IsOptional() @IsString() @MaxLength(50) reps?: string;
  @IsOptional() @IsInt() @Min(0) @Max(3600) restSeconds?: number;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

class SessionInput {
  @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @IsString() @MinLength(2) @MaxLength(120) title: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ExerciseInput)
  exercises: ExerciseInput[];
}

export class CreateProgramDto {
  @IsString() athleteUserId: string;
  @IsString() @MinLength(3) @MaxLength(150) title: string;
  @IsOptional() @IsIn(['FAT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'ENDURANCE', 'REHABILITATION'])
  goal?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  // If this program is being created from a reviewed AI draft.
  @IsOptional() @IsString() sourceAISuggestionId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SessionInput)
  sessions: SessionInput[];
}

export class UpdateProgramStatusDto {
  @IsIn(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}
