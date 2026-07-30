import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBodyMeasurementDto,
  CreateGoalDto,
  RequestMembershipDto,
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
          profileImageUrl: true,
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

  /**
   * Membership selection starts in the public, cross-tenant marketplace.
   * The athlete may not have a tenant in their current JWT yet, so this
   * narrowly-scoped transition validates both tenant and plan through the
   * platform client, then sets the selected gym as the athlete's active
   * tenant. The mobile app signs in again after this operation so future
   * tenant-scoped reads use a fresh trusted tenant claim.
   */
  async requestMembership(userId: string, dto: RequestMembershipDto) {
    const db = this.prisma.forPlatform();
    const [user, tenant, plan, activeMembership] = await Promise.all([
      db.user.findFirst({ where: { id: userId, role: 'ATHLETE', isActive: true } }),
      db.tenant.findFirst({
        where: { id: dto.tenantId, isActive: true, isVerified: true },
        select: { id: true, name: true },
      }),
      db.membershipPlan.findFirst({
        where: { id: dto.planId, tenantId: dto.tenantId, isActive: true },
      }),
      db.membership.findFirst({
        where: {
          userId,
          status: { in: ['PENDING_INSURANCE', 'PENDING_PAYMENT', 'ACTIVE'] },
        },
        include: { tenant: { select: { name: true } } },
      }),
    ]);

    if (!user) throw new NotFoundException('حساب ورزشکار یافت نشد.');
    if (!tenant) throw new BadRequestException('باشگاه انتخاب‌شده فعال یا تاییدشده نیست.');
    if (!plan) throw new BadRequestException('طرح عضویت انتخاب‌شده معتبر نیست.');
    if (activeMembership) {
      throw new ConflictException(
        `ابتدا وضعیت عضویت فعلی در ${activeMembership.tenant.name} را مشخص کنید.`,
      );
    }

    return db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { tenantId: tenant.id },
      });
      const membership = await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId,
          planId: plan.id,
          status: 'PENDING_INSURANCE',
        },
        include: {
          plan: true,
          tenant: { select: { name: true, slug: true } },
        },
      });
      return {
        membership,
        requiresReauthentication: true,
        message: 'درخواست عضویت ثبت شد. برای فعال‌سازی، بیمه ورزشی را تکمیل کنید.',
      };
    });
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

  async submitInsurance(userId: string, dto: SubmitInsuranceDto) {
    if (dto.validFrom && dto.validUntil && new Date(dto.validUntil) <= new Date(dto.validFrom)) {
      throw new BadRequestException('تاریخ پایان بیمه باید بعد از تاریخ شروع باشد.');
    }
    return this.prisma.forTenant(async (tx) => {
      const latest = await tx.insuranceDocument.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (latest?.status === 'PENDING') {
        throw new ConflictException('یک مدرک بیمه در انتظار بررسی دارید.');
      }
      if (
        latest?.status === 'APPROVED' &&
        (!latest.validUntil || latest.validUntil > new Date())
      ) {
        throw new ConflictException('بیمه ورزشی معتبر شما قبلاً تأیید شده است.');
      }

      return tx.insuranceDocument.create({
        data: {
          userId,
          documentUrl: dto.documentUrl,
          provider: dto.provider,
          policyNumber: dto.policyNumber,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        },
      });
    });
  }

  submitParentalConsent(userId: string, dto: SubmitParentalConsentDto) {
    return this.prisma.forTenant(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { isMinor: true, parentalConsent: { select: { status: true } } },
      });
      if (!user?.isMinor) throw new BadRequestException('رضایت‌نامه فقط برای کاربران زیر ۱۸ سال لازم است.');
      if (user.parentalConsent?.status === 'PENDING') {
        throw new ConflictException('رضایت‌نامه شما در انتظار بررسی باشگاه است.');
      }
      if (user.parentalConsent?.status === 'APPROVED') {
        throw new ConflictException('رضایت‌نامه شما قبلاً تأیید شده است.');
      }
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
