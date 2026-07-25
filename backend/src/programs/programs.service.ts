import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CreateProgramDto, UpdateProgramStatusDto } from './dto/program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  async create(trainerUserId: string, dto: CreateProgramDto) {
    return this.prisma.forTenant(async (tx) => {
      const trainer = await tx.trainerProfile.findUnique({ where: { userId: trainerUserId } });
      if (!trainer || trainer.status !== 'APPROVED') {
        throw new ForbiddenException('مربی هنوز توسط باشگاه تایید نشده است.');
      }

      const athlete = await tx.athleteProfile.findUnique({ where: { userId: dto.athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');

      // If sourced from an AI draft, that draft must already be APPROVED —
      // this is the enforcement point for the "no AI output reaches an
      // athlete without professional sign-off" rule for workout programs.
      if (dto.sourceAISuggestionId) {
        const suggestion = await tx.aiSuggestion.findUnique({
          where: { id: dto.sourceAISuggestionId },
        });
        if (!suggestion || suggestion.status !== 'APPROVED') {
          throw new BadRequestException(
            'پیشنهاد هوش مصنوعی باید قبل از تبدیل به برنامه فعال، تایید شود.',
          );
        }
      }

      return tx.trainingProgram.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          trainerId: trainer.id,
          athleteId: athlete.id,
          title: dto.title,
          goal: dto.goal as any,
          status: 'ACTIVE',
          sourceAISuggestionId: dto.sourceAISuggestionId,
          sessions: {
            create: dto.sessions.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              title: s.title,
              exercises: {
                create: s.exercises.map((e, idx) => ({
                  name: e.name,
                  sets: e.sets,
                  reps: e.reps,
                  restSeconds: e.restSeconds,
                  notes: e.notes,
                  sortOrder: idx,
                })),
              },
            })),
          },
        },
        include: {
          trainer: { include: { user: { select: { firstName: true, lastName: true } } } },
          sessions: { include: { exercises: true } },
        },
      });
    });
  }

  listForAthlete(athleteUserId: string) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await tx.athleteProfile.findUnique({ where: { userId: athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');
      return tx.trainingProgram.findMany({
        where: { athleteId: athlete.id },
        include: {
          trainer: { include: { user: { select: { firstName: true, lastName: true } } } },
          sessions: { include: { exercises: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  updateStatus(programId: string, dto: UpdateProgramStatusDto) {
    return this.prisma.forTenant((tx) =>
      tx.trainingProgram.update({ where: { id: programId }, data: { status: dto.status as any } }),
    );
  }
}
