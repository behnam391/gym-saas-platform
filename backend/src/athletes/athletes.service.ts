import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBodyMeasurementDto,
  CreateGoalDto,
  SubmitInsuranceDto,
  SubmitParentalConsentDto,
  UpdateAthleteProfileDto,
  UpdateGoalDto,
} from './dto/athlete.dto';

@Injectable()
export class AthletesService {
  constructor(private readonly prisma: PrismaService) {}

  getProfile(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          gender: true,
          dateOfBirth: true,
          isMinor: true,
          isRestricted: true,
          city: true,
          address: true,
          athleteProfile: true,
          parentalConsent: true,
          insuranceDocs: { orderBy: { createdAt: 'desc' }, take: 1 },
          memberships: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: true, tenant: { select: { name: true, slug: true } } },
          },
        },
      }),
    );
  }

  updateProfile(userId: string, dto: UpdateAthleteProfileDto) {
    return this.prisma.forTenant((tx) =>
      tx.athleteProfile.upsert({
        where: { userId },
        create: { userId, ...(dto as any) },
        update: dto as any,
      }),
    );
  }

  listMeasurements(userId: string) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await this.requireAthlete(tx, userId);
      return tx.bodyMeasurement.findMany({
        where: { athleteId: athlete.id },
        orderBy: { recordedAt: 'desc' },
        take: 100,
      });
    });
  }

  async addMeasurement(userId: string, dto: CreateBodyMeasurementDto) {
    const values = { ...dto } as Record<string, unknown>;
    delete values.recordedAt;
    if (!Object.values(values).some((value) => value !== undefined)) {
      throw new BadRequestException('حداقل یک مقدار اندازه‌گیری باید وارد شود.');
    }

    return this.prisma.forTenant(async (tx) => {
      const athlete = await this.requireAthlete(tx, userId);
      const measurement = await tx.bodyMeasurement.create({
        data: {
          athleteId: athlete.id,
          ...(dto as any),
          recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        },
      });
      if (dto.weightKg !== undefined) {
        await tx.athleteProfile.update({ where: { id: athlete.id }, data: { weightKg: dto.weightKg } });
      }
      return measurement;
    });
  }

  listGoals(userId: string) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await this.requireAthlete(tx, userId);
      return tx.goal.findMany({ where: { athleteId: athlete.id }, orderBy: { createdAt: 'desc' } });
    });
  }

  createGoal(userId: string, dto: CreateGoalDto) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await this.requireAthlete(tx, userId);
      return tx.goal.create({
        data: {
          athleteId: athlete.id,
          type: dto.type as any,
          targetValue: dto.targetValue,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        },
      });
    });
  }

  updateGoal(userId: string, goalId: string, dto: UpdateGoalDto) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await this.requireAthlete(tx, userId);
      const goal = await tx.goal.findFirst({ where: { id: goalId, athleteId: athlete.id } });
      if (!goal) throw new NotFoundException('هدف یافت نشد.');
      return tx.goal.update({
        where: { id: goalId },
        data: { ...dto, targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined },
      });
    });
  }

  listMemberships(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.membership.findMany({
        where: { userId },
        include: { plan: true, tenant: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  listPayments(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.payment.findMany({
        where: { userId },
        include: { membership: { include: { plan: true } }, order: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }

  listAttendance(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.attendance.findMany({
        where: { userId },
        orderBy: { checkInAt: 'desc' },
        take: 100,
      }),
    );
  }

  getProgress(userId: string) {
    return this.prisma.forTenant(async (tx) => {
      const athlete = await this.requireAthlete(tx, userId);
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const [measurements, attendanceCount, activePrograms, activeDiets, goals] = await Promise.all([
        tx.bodyMeasurement.findMany({ where: { athleteId: athlete.id }, orderBy: { recordedAt: 'desc' }, take: 12 }),
        tx.attendance.count({ where: { userId, checkInAt: { gte: since } } }),
        tx.trainingProgram.count({ where: { athleteId: athlete.id, status: 'ACTIVE' } }),
        tx.dietPlan.count({ where: { athleteId: athlete.id, status: 'ACTIVE' } }),
        tx.goal.findMany({ where: { athleteId: athlete.id }, orderBy: { createdAt: 'desc' } }),
      ]);
      const latest = measurements[0] ?? null;
      const previous = measurements[1] ?? null;
      return {
        latestMeasurement: latest,
        weightChangeKg:
          latest?.weightKg != null && previous?.weightKg != null
            ? Number((latest.weightKg - previous.weightKg).toFixed(2))
            : null,
        attendanceLast30Days: attendanceCount,
        activePrograms,
        activeDiets,
        goals,
        measurements,
      };
    });
  }

  submitInsurance(userId: string, dto: SubmitInsuranceDto) {
    if (dto.validFrom && dto.validUntil && new Date(dto.validUntil) <= new Date(dto.validFrom)) {
      throw new BadRequestException('تاریخ پایان بیمه باید بعد از تاریخ شروع باشد.');
    }
    return this.prisma.forTenant((tx) =>
      tx.insuranceDocument.create({
        data: {
          userId,
          documentUrl: dto.documentUrl,
          provider: dto.provider,
          policyNumber: dto.policyNumber,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        },
      }),
    );
  }

  submitParentalConsent(userId: string, dto: SubmitParentalConsentDto) {
    return this.prisma.forTenant(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { isMinor: true } });
      if (!user?.isMinor) throw new BadRequestException('رضایت‌نامه فقط برای کاربران زیر ۱۸ سال لازم است.');
      return tx.parentalConsent.upsert({
        where: { userId },
        create: { userId, ...dto },
        update: { ...dto, status: 'PENDING', reviewedAt: null, reviewedById: null, rejectionReason: null },
      });
    });
  }

  private async requireAthlete(tx: any, userId: string) {
    const athlete = await tx.athleteProfile.findUnique({ where: { userId } });
    if (!athlete) throw new NotFoundException('پروفایل ورزشکار یافت نشد.');
    return athlete;
  }
}
