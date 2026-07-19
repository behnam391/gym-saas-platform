import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiProviderService } from './ai-provider.service';
import { AI_SYSTEM_PROMPTS } from './ai-prompts';
import { GenerateSuggestionDto, ReviewSuggestionDto } from './dto/ai-engine.dto';
import { calculateAge } from '../common/age.util';
import { Prisma } from '@prisma/client';

const MODEL_VERSION = 'claude-sonnet-4-6';

@Injectable()
export class AiEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AiProviderService,
  ) {}

  async generate(dto: GenerateSuggestionDto) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await tx.athleteProfile.findUnique({
        where: { userId: dto.athleteUserId },
        include: { user: true, measurements: { orderBy: { recordedAt: 'desc' }, take: 1 } },
      });
      if (!athlete) throw new NotFoundException('پروفایل ورزشکار یافت نشد.');

      const inputSnapshot = {
        age: calculateAge(athlete.user.dateOfBirth),
        gender: athlete.user.gender,
        heightCm: athlete.heightCm,
        weightKg: athlete.weightKg,
        latestMeasurement: athlete.measurements[0] ?? null,
        trainingHistory: athlete.trainingHistory,
        injuries: athlete.injuries,
        illnesses: athlete.illnesses,
        medications: athlete.medications,
        allergies: athlete.allergies,
        fitnessGoal: athlete.fitnessGoal,
        trainingLevel: athlete.trainingLevel,
        activityLevel: athlete.activityLevel,
      };

      const systemPrompt = AI_SYSTEM_PROMPTS[dto.type];
      const outputJson = await this.aiProvider.generateStructuredOutput(
        systemPrompt,
        inputSnapshot,
      );

      // Every AI output starts life as GENERATED — it is NEVER surfaced to
      // the athlete or turned into an active TrainingProgram/DietPlan until
      // a trainer/nutritionist moves it to APPROVED via review().
      return tx.aiSuggestion.create({
        data: {
          athleteId: athlete.id,
          type: dto.type as any,
          status: 'GENERATED',
          inputSnapshot,
          outputJson: outputJson as Prisma.InputJsonValue,
          modelVersion: MODEL_VERSION,
        },
      });
    });
  }

  listForAthlete(athleteUserId: string, callerRole: string) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await tx.athleteProfile.findUnique({ where: { userId: athleteUserId } });
      if (!athlete) throw new NotFoundException('پروفایل ورزشکار یافت نشد.');
      return tx.aiSuggestion.findMany({
        where: {
          athleteId: athlete.id,
          // Athletes only ever see professionally-approved output — raw
          // AI drafts (GENERATED/EDITED) stay internal to trainers/nutritionists
          // until reviewed, per the AI Engine's review-gate requirement.
          ...(callerRole === 'ATHLETE' ? { status: 'APPROVED' } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  /** Only a TRAINER or NUTRITIONIST may move a suggestion out of GENERATED —
   * enforced again here (not just via @Roles()) because the type of
   * suggestion being reviewed must match the reviewer's professional domain. */
  async review(
    suggestionId: string,
    reviewerId: string,
    reviewerRole: string,
    dto: ReviewSuggestionDto,
  ) {
    return this.prisma.forTenant(async (tx) => {
      const suggestion = await tx.aiSuggestion.findUnique({ where: { id: suggestionId } });
      if (!suggestion) throw new NotFoundException('پیشنهاد هوش مصنوعی یافت نشد.');

      const trainerTypes = ['WORKOUT_DRAFT', 'TRAINER_SUMMARY'];
      const nutritionistTypes = ['NUTRITION_DRAFT', 'NUTRITIONIST_SUMMARY'];

      if (reviewerRole === 'TRAINER' && !trainerTypes.includes(suggestion.type)) {
        throw new ForbiddenException('این نوع پیشنهاد در حوزه بازبینی مربی نیست.');
      }
      if (reviewerRole === 'NUTRITIONIST' && !nutritionistTypes.includes(suggestion.type)) {
        throw new ForbiddenException('این نوع پیشنهاد در حوزه بازبینی متخصص تغذیه نیست.');
      }

      return tx.aiSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: dto.status as any,
          outputJson: (dto.editedOutput ?? suggestion.outputJson) as Prisma.InputJsonValue,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });
    });
  }
}
