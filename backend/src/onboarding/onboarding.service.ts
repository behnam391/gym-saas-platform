import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOnboardingApplicationDto,
  ReviewOnboardingApplicationDto,
} from './dto/onboarding.dto';
import { OtpService } from '../auth/otp.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
  ) {}

  async create(dto: CreateOnboardingApplicationDto) {
    if (dto.type === 'GYM_OWNER' && (!dto.gymName?.trim() || !dto.province?.trim() || !dto.address?.trim())) {
      throw new BadRequestException('نام باشگاه، استان و آدرس برای درخواست باشگاه الزامی است.');
    }
    if (dto.type !== 'GYM_OWNER' && !dto.specialty?.trim()) {
      throw new BadRequestException('حوزه تخصص برای درخواست همکاری الزامی است.');
    }

    const verification = await this.otp.consume(
      dto.verificationToken,
      'ONBOARDING',
    );
    if (
      verification.destination !== dto.mobile &&
      verification.destination !== dto.email?.trim().toLowerCase()
    ) {
      throw new BadRequestException(
        'شماره موبایل یا ایمیل تأییدشده با اطلاعات فرم یکسان نیست.',
      );
    }

    const db = this.prisma.forPlatform();
    const duplicate = await db.onboardingApplication.findFirst({
      where: {
        mobile: dto.mobile,
        type: dto.type,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('یک درخواست در حال بررسی با این شماره موبایل وجود دارد.');
    }

    const application = await db.onboardingApplication.create({
      data: {
        type: dto.type,
        nationalId: dto.nationalId,
        mobile: dto.mobile,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        city: dto.city.trim(),
        email: dto.email?.trim() || null,
        province: dto.province?.trim() || null,
        address: dto.address?.trim() || null,
        gymName: dto.gymName?.trim() || null,
        specialty: dto.specialty?.trim() || null,
        licenseNumber: dto.licenseNumber?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
      select: { id: true, type: true, status: true, createdAt: true },
    });

    return {
      ...application,
      message: dto.type === 'GYM_OWNER'
        ? 'درخواست راه‌اندازی پنل باشگاه ثبت شد. پس از بررسی، نتیجه از طریق موبایل اعلام می‌شود.'
        : 'درخواست همکاری حرفه‌ای ثبت شد. پس از بررسی مدارک، نتیجه از طریق موبایل اعلام می‌شود.',
    };
  }

  list() {
    return this.prisma.forPlatform().onboardingApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: 250,
    });
  }

  async review(applicationId: string, dto: ReviewOnboardingApplicationDto) {
    const db = this.prisma.forPlatform();
    const existing = await db.onboardingApplication.findUnique({ where: { id: applicationId }, select: { id: true } });
    if (!existing) throw new NotFoundException('درخواست ثبت‌نام یافت نشد.');
    return db.onboardingApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        reviewNotes: dto.reviewNotes?.trim() || null,
        reviewedAt: new Date(),
      },
    });
  }
}
