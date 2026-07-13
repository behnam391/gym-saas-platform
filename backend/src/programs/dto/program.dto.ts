import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExerciseInput {
  @IsString() name: string;
  @IsOptional() sets?: number;
  @IsOptional() @IsString() reps?: string;
  @IsOptional() restSeconds?: number;
  @IsOptional() @IsString() notes?: string;
}

class SessionInput {
  dayOfWeek: number;
  @IsString() title: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ExerciseInput)
  exercises: ExerciseInput[];
}

export class CreateProgramDto {
  @IsString() athleteUserId: string;
  @IsString() title: string;
  @IsOptional() @IsIn(['FAT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'ENDURANCE', 'REHABILITATION'])
  goal?: string;
  // If this program is being created from a reviewed AI draft.
  @IsOptional() @IsString() sourceAISuggestionId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SessionInput)
  sessions: SessionInput[];
}

export class UpdateProgramStatusDto {
  @IsIn(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}
