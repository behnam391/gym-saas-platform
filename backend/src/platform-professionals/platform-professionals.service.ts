import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConsultationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConsultationRequestDto,
  CreatePlatformProfessionalDto,
  SetPlatformProfessionalAccessDto,
} from './dto/platform-professional.dto';

@Injectable()
export class PlatformProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  publicList(type?: 'TRAINER' | 'NUTRITIONIST') {
    return this.prisma.forPlatform().platformProfessional.findMany({
      where: { isActive: true, ...(type ? { type } : {}) },
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  adminList() {
    return this.prisma.forPlatform().platformProfessional.findMany({
      include: { _count: { select: { consultationRequests: true } } },
      orderBy: [{ isActive: 'desc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  adminConsultations(status?: string) {
    return this.prisma.forPlatform().consultationRequest.findMany({
      where: status ? { status: status as ConsultationStatus } : undefined,
      include: {
        professional: true,
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    });
  }

  async updateConsultationStatus(requestId: string, status: string) {
    const db = this.prisma.forPlatform();
    const existing = await db.consultationRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('درخواست مشاوره یافت نشد.');
    }
    return db.consultationRequest.update({
      where: { id: requestId },
      data: { status: status as ConsultationStatus },
      include: {
        professional: true,
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
          },
        },
      },
    });
  }

  create(dto: CreatePlatformProfessionalDto) {
    return this.prisma.forPlatform().platformProfessional.create({
      data: {
        ...dto,
        fullName: dto.fullName.trim(),
        profileImageUrl: dto.profileImageUrl?.trim() || null,
        bio: dto.bio?.trim() || null,
        province: dto.province?.trim() || null,
        city: dto.city?.trim() || null,
        specialties: dto.specialties.map((item) => item.trim()).filter(Boolean),
      },
      include: { _count: { select: { consultationRequests: true } } },
    });
  }

  async setAccess(professionalId: string, dto: SetPlatformProfessionalAccessDto) {
    const db = this.prisma.forPlatform();
    const existing = await db.platformProfessional.findUnique({ where: { id: professionalId }, select: { id: true } });
    if (!existing) throw new NotFoundException('متخصص سراسری یافت نشد.');
    return db.platformProfessional.update({
      where: { id: professionalId },
      data: { isActive: dto.isActive },
      include: { _count: { select: { consultationRequests: true } } },
    });
  }

  async requestConsultation(
    athleteId: string,
    professionalId: string,
    dto: CreateConsultationRequestDto,
  ) {
    const db = this.prisma.forPlatform();
    const [athlete, professional, duplicate] = await Promise.all([
      db.user.findFirst({ where: { id: athleteId, role: 'ATHLETE', isActive: true }, select: { id: true } }),
      db.platformProfessional.findFirst({ where: { id: professionalId, isActive: true }, select: { id: true, fullName: true } }),
      db.consultationRequest.findFirst({
        where: {
          athleteId,
          professionalId,
          status: { in: ['REQUESTED', 'CONTACTED', 'CONFIRMED'] },
        },
        select: { id: true },
      }),
    ]);
    if (!athlete) throw new NotFoundException('حساب ورزشکار یافت نشد.');
    if (!professional) throw new NotFoundException('متخصص انتخاب‌شده فعال نیست.');
    if (duplicate) throw new ConflictException('برای این متخصص یک درخواست باز دارید.');

    const request = await db.consultationRequest.create({
      data: {
        athleteId,
        professionalId,
        preferredAt: dto.preferredAt ? new Date(dto.preferredAt) : null,
        message: dto.message?.trim() || null,
      },
      include: { professional: true },
    });
    return {
      ...request,
      message: `درخواست مشاوره با ${professional.fullName} ثبت شد.`,
    };
  }

  mine(athleteId: string) {
    return this.prisma.forPlatform().consultationRequest.findMany({
      where: { athleteId },
      include: { professional: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
