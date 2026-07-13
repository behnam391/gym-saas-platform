import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const AI_SUGGESTION_TYPES = [
  'BODY_ANALYSIS',
  'WORKOUT_DRAFT',
  'NUTRITION_DRAFT',
  'TRAINER_SUMMARY',
  'NUTRITIONIST_SUMMARY',
  'RISK_WARNING',
] as const;

export class GenerateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  athleteUserId: string;

  @IsIn(AI_SUGGESTION_TYPES, { message: 'نوع پیشنهاد هوش مصنوعی نامعتبر است.' })
  type: (typeof AI_SUGGESTION_TYPES)[number];
}

export class ReviewSuggestionDto {
  @IsIn(['EDITED', 'APPROVED', 'REJECTED'])
  status: 'EDITED' | 'APPROVED' | 'REJECTED';

  // When status === 'EDITED', the professional's corrected JSON replaces outputJson.
  @IsOptional()
  editedOutput?: Record<string, unknown>;
}
