import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyTrainerDto, ReviewTrainerDto, AssignStudentDto } from './dto/trainer.dto';

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Called by a user whose role is already TRAINER (assigned at account
   * creation by the gym owner) to submit verification documents. */
  apply(userId: string, dto: ApplyTrainerDto) {
    return this.prisma.forTenant((tx) =>
      tx.trainerProfile.upsert({
        where: { userId },
        update: {
          bio: dto.bio,
          specialties: dto.specialties,
          certificateUrl: dto.certificateUrl,
          status: 'PENDING',
          rejectionReason: null,
        },
        create: {
          userId,
          bio: dto.bio,
          specialties: dto.specialties,
          certificateUrl: dto.certificateUrl,
        },
      }),
    );
  }

  getMine(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.trainerProfile.findUnique({ where: { userId } }),
    );
  }

  listPending() {
    return this.prisma.forTenant((tx) =>
      tx.trainerProfile.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { firstName: true, lastName: true, mobile: true } } },
      }),
    );
  }

  /** Trainers are approved by the GYM_OWNER — enforced via @Roles() on the
   * controller, not here; this method just performs the update. */
  async review(trainerProfileId: string, approverId: string, dto: ReviewTrainerDto) {
    return this.prisma.forTenant(async (tx) => {
      const profile = await tx.trainerProfile.findUnique({ where: { id: trainerProfileId } });
      if (!profile) throw new NotFoundException('پروفایل مربی یافت نشد.');

      return tx.trainerProfile.update({
        where: { id: trainerProfileId },
        data: {
          status: dto.status,
          approvedById: approverId,
          approvedAt: new Date(),
          rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
        },
      });
    });
  }

  async assignStudent(trainerUserId: string, dto: AssignStudentDto) {
    return this.prisma.forTenant(async (tx) => {
      const trainer = await tx.trainerProfile.findUnique({ where: { userId: trainerUserId } });
      if (!trainer || trainer.status !== 'APPROVED') {
        throw new BadRequestException('مربی هنوز توسط باشگاه تایید نشده است.');
      }

      const athlete = await tx.athleteProfile.findUnique({ where: { userId: dto.athleteUserId } });
      if (!athlete) throw new NotFoundException('ورزشکار یافت نشد.');

      return tx.trainerStudent.upsert({
        where: { trainerId_athleteId: { trainerId: trainer.id, athleteId: athlete.id } },
        create: { trainerId: trainer.id, athleteId: athlete.id, userId: dto.athleteUserId },
        update: { userId: dto.athleteUserId, isActive: true, endedAt: null },
      });
    });
  }

  listStudents(trainerUserId: string) {
    return this.prisma.forTenant(async (tx) => {
      const trainer = await tx.trainerProfile.findUnique({ where: { userId: trainerUserId } });
      if (!trainer) throw new NotFoundException('پروفایل مربی یافت نشد.');
      return tx.trainerStudent.findMany({
        where: { trainerId: trainer.id, isActive: true },
        include: { user: { select: { firstName: true, lastName: true, mobile: true } } },
      });
    });
  }
}
