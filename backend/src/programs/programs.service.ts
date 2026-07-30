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

      const assignment = await tx.trainerStudent.findUnique({
        where: {
          trainerId_athleteId: { trainerId: trainer.id, athleteId: athlete.id },
        },
      });
      if (!assignment?.isActive) {
        throw new ForbiddenException('این ورزشکار به شما اختصاص داده نشده است.');
      }

      this.validateDateRange(dto.startDate, dto.endDate);

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

      await tx.trainingProgram.updateMany({
        where: { athleteId: athlete.id, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });

      return tx.trainingProgram.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          trainerId: trainer.id,
          athleteId: athlete.id,
          title: dto.title,
          goal: dto.goal as any,
          status: 'ACTIVE',
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
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
          athlete: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          sessions: { include: { exercises: true } },
        },
      });
    });
  }

  listForAthlete(
    athleteUserId: string,
    options: { hideDrafts?: boolean; trainerUserId?: string } | boolean = {},
  ) {
    const normalizedOptions =
      typeof options === 'boolean' ? { hideDrafts: options } : options;
    return this.prisma.forTenant(async (tx) => {
      const athlete = await tx.athleteProfile.findUnique({ where: { userId: athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');

      if (normalizedOptions.trainerUserId) {
        const assignment = await tx.trainerStudent.findFirst({
          where: {
            athleteId: athlete.id,
            isActive: true,
            trainer: { userId: normalizedOptions.trainerUserId },
          },
        });
        if (!assignment) {
          throw new ForbiddenException('این ورزشکار به شما اختصاص داده نشده است.');
        }
      }

      return tx.trainingProgram.findMany({
        where: {
          athleteId: athlete.id,
          ...(normalizedOptions.hideDrafts ? { status: { not: 'DRAFT' as const } } : {}),
        },
        include: {
          trainer: { include: { user: { select: { firstName: true, lastName: true } } } },
          athlete: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          sessions: {
            include: { exercises: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  updateStatus(trainerUserId: string, programId: string, dto: UpdateProgramStatusDto) {
    return this.prisma.forTenant(async (tx) => {
      const program = await tx.trainingProgram.findFirst({
        where: { id: programId, trainer: { userId: trainerUserId } },
        select: { id: true, athleteId: true },
      });
      if (!program) throw new NotFoundException('برنامه تمرینی متعلق به شما یافت نشد.');

      if (dto.status === 'ACTIVE') {
        await tx.trainingProgram.updateMany({
          where: {
            athleteId: program.athleteId,
            status: 'ACTIVE',
            id: { not: program.id },
          },
          data: { status: 'ARCHIVED' },
        });
      }

      return tx.trainingProgram.update({
        where: { id: program.id },
        data: { status: dto.status as any },
      });
    });
  }

  private validateDateRange(startDate?: string, endDate?: string) {
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new BadRequestException('تاریخ پایان برنامه باید بعد از تاریخ شروع باشد.');
    }
  }
}
