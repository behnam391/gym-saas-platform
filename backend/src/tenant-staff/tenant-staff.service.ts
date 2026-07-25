import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { isMinor } from '../common/age.util';
import {
  CreateTenantStaffDto,
  SetTenantStaffAccessDto,
} from './dto/tenant-staff.dto';

const STAFF_ROLES = ['RECEPTION', 'BUFFET_STAFF', 'TRAINER', 'NUTRITIONIST'] as const;

@Injectable()
export class TenantStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  list() {
    return this.prisma.forTenant((tx) => tx.user.findMany({
      where: { role: { in: [...STAFF_ROLES] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobile: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        trainerProfile: { select: { specialties: true, status: true } },
        nutritionistProfile: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }));
  }

  async create(actorId: string, dto: CreateTenantStaffDto) {
    if (!STAFF_ROLES.includes(dto.role)) {
      throw new BadRequestException('این نقش از پنل باشگاه قابل ساخت نیست.');
    }
    const dateOfBirth = new Date(dto.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > new Date()) {
      throw new BadRequestException('تاریخ تولد نامعتبر است.');
    }

    const db = this.prisma.forPlatform();
    const duplicate = await db.user.findFirst({
      where: { OR: [{ mobile: dto.mobile }, { nationalId: dto.nationalId }] },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('کاربری با این موبایل یا کد ملی قبلاً وجود دارد.');
    }

    const tenantId = this.tenantContext.requireTenantId();
    const temporaryPassword = `Gy!${randomBytes(7).toString('base64url')}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const specialties = dto.specialties?.map((item) => item.trim()).filter(Boolean) ?? [];

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenantId,
          role: dto.role,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          nationalId: dto.nationalId,
          mobile: dto.mobile,
          email: dto.email?.trim() || null,
          passwordHash,
          gender: dto.gender,
          dateOfBirth,
          isMinor: isMinor(dateOfBirth),
          ...(dto.role === 'TRAINER'
            ? { trainerProfile: { create: { bio: dto.bio?.trim() || null, specialties, status: 'APPROVED', approvedById: actorId, approvedAt: new Date() } } }
            : {}),
          ...(dto.role === 'NUTRITIONIST'
            ? { nutritionistProfile: { create: { bio: dto.bio?.trim() || null, status: 'APPROVED', approvedById: actorId, approvedAt: new Date() } } }
            : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          trainerProfile: { select: { specialties: true, status: true } },
          nutritionistProfile: { select: { status: true } },
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          actorId,
          action: 'TENANT_STAFF_CREATED',
          entityType: 'User',
          entityId: created.id,
          metadata: { role: dto.role, mobile: dto.mobile },
        },
      });
      return created;
    });

    return { ...user, temporaryPassword };
  }

  async setAccess(actorId: string, staffId: string, dto: SetTenantStaffAccessDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.forTenant(async (tx) => {
      const staff = await tx.user.findFirst({
        where: { id: staffId, role: { in: [...STAFF_ROLES] } },
        select: { id: true },
      });
      if (!staff) throw new NotFoundException('حساب پرسنلی یافت نشد.');
      const updated = await tx.user.update({
        where: { id: staffId },
        data: { isActive: dto.isActive },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          trainerProfile: { select: { specialties: true, status: true } },
          nutritionistProfile: { select: { status: true } },
        },
      });
      if (!dto.isActive) await tx.refreshToken.deleteMany({ where: { userId: staffId } });
      await tx.auditLog.create({
        data: {
          tenantId,
          actorId,
          action: dto.isActive ? 'TENANT_STAFF_ACTIVATED' : 'TENANT_STAFF_DEACTIVATED',
          entityType: 'User',
          entityId: staffId,
        },
      });
      return updated;
    });
  }
}
