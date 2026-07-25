import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import {
  CreateAttendanceCredentialDto,
  CreateAttendanceDeviceDto,
  DeviceAttendanceEventDto,
  SetAttendanceCredentialStatusDto,
  SetAttendanceDeviceStatusDto,
} from './dto/attendance-device.dto';

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

const ATTENDANCE_METHOD = {
  CARD: 'MEMBERSHIP_CARD',
  FINGERPRINT: 'FINGERPRINT',
  FACE_RECOGNITION: 'FACE_RECOGNITION',
  NFC_PHONE: 'NFC_PHONE',
} as const;

@Injectable()
export class AttendanceDevicesService {
  constructor(private readonly prisma: PrismaService, private readonly tenantContext: TenantContext) {}

  list() {
    return this.prisma.forTenant((tx) => tx.attendanceDevice.findMany({
      select: { id: true, name: true, type: true, vendor: true, model: true, serialNumber: true, apiKeyLast4: true, status: true, lastSeenAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }));
  }

  async create(dto: CreateAttendanceDeviceDto) {
    const apiKey = `gym_${randomBytes(24).toString('hex')}`;
    const device = await this.prisma.forTenant((tx) => tx.attendanceDevice.create({
      data: {
        ...dto,
        tenantId: this.tenantContext.requireTenantId(),
        apiKeyDigest: digest(apiKey),
        apiKeyLast4: apiKey.slice(-4),
        status: 'PENDING',
      },
      select: { id: true, name: true, type: true, vendor: true, model: true, serialNumber: true, apiKeyLast4: true, status: true, createdAt: true },
    }));
    return { ...device, apiKey, eventEndpoint: '/api/v1/attendance-devices/events' };
  }

  async setStatus(deviceId: string, dto: SetAttendanceDeviceStatusDto) {
    return this.prisma.forTenant(async (tx) => {
      const device = await tx.attendanceDevice.findUnique({ where: { id: deviceId }, select: { id: true } });
      if (!device) throw new NotFoundException('دستگاه این باشگاه یافت نشد.');
      return tx.attendanceDevice.update({
        where: { id: deviceId },
        data: { status: dto.status },
        select: { id: true, name: true, type: true, vendor: true, model: true, serialNumber: true, apiKeyLast4: true, status: true, lastSeenAt: true, createdAt: true },
      });
    });
  }

  async addCredential(dto: CreateAttendanceCredentialDto) {
    return this.prisma.forTenant(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: dto.userId }, select: { id: true } });
      if (!user) throw new NotFoundException('کاربر این باشگاه یافت نشد.');
      return tx.attendanceCredential.upsert({
        where: { tenantId_type_identifierHash: { tenantId: this.tenantContext.requireTenantId(), type: dto.type, identifierHash: digest(`${dto.type}:${dto.identifier}`) } },
        create: {
          tenantId: this.tenantContext.requireTenantId(),
          userId: dto.userId,
          type: dto.type,
          identifierHash: digest(`${dto.type}:${dto.identifier}`),
          identifierLast4: dto.identifier.slice(-4),
          label: dto.label,
        },
        update: { userId: dto.userId, label: dto.label, isActive: true },
        select: {
          id: true,
          type: true,
          identifierLast4: true,
          label: true,
          isActive: true,
          createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true, mobile: true } },
        },
      });
    });
  }

  listCredentials() {
    return this.prisma.forTenant((tx) => tx.attendanceCredential.findMany({
      select: {
        id: true,
        type: true,
        identifierLast4: true,
        label: true,
        isActive: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, mobile: true } },
      },
      orderBy: { createdAt: 'desc' },
    }));
  }

  async setCredentialStatus(credentialId: string, dto: SetAttendanceCredentialStatusDto) {
    return this.prisma.forTenant(async (tx) => {
      const credential = await tx.attendanceCredential.findUnique({ where: { id: credentialId }, select: { id: true } });
      if (!credential) throw new NotFoundException('شناسه تردد این باشگاه یافت نشد.');
      return tx.attendanceCredential.update({
        where: { id: credentialId },
        data: { isActive: dto.isActive },
        select: {
          id: true,
          type: true,
          identifierLast4: true,
          label: true,
          isActive: true,
          createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true, mobile: true } },
        },
      });
    });
  }

  async ingest(apiKey: string | undefined, dto: DeviceAttendanceEventDto) {
    if (!apiKey) throw new UnauthorizedException('کلید دستگاه ارسال نشده است.');
    const db = this.prisma.forPlatform();
    const device = await db.attendanceDevice.findUnique({ where: { apiKeyDigest: digest(apiKey) } });
    if (!device || device.status === 'DISABLED') throw new UnauthorizedException('دستگاه معتبر نیست.');
    if (device.type !== dto.type) throw new BadRequestException('نوع شناسه با دستگاه تطبیق ندارد.');

    const credential = await db.attendanceCredential.findUnique({
      where: { tenantId_type_identifierHash: { tenantId: device.tenantId, type: dto.type, identifierHash: digest(`${dto.type}:${dto.identifier}`) } },
    });
    if (!credential?.isActive) throw new NotFoundException('شناسهٔ حضور برای عضوی ثبت نشده است.');

    const membership = await db.membership.findFirst({
      where: { tenantId: device.tenantId, userId: credential.userId, status: 'ACTIVE', OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
      orderBy: { endDate: 'desc' },
    });
    if (!membership) throw new BadRequestException('عضویت فعال برای این کاربر وجود ندارد.');

    await db.attendanceDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date(), status: 'CONNECTED' } });
    const openAttendance = await db.attendance.findFirst({
      where: { tenantId: device.tenantId, userId: credential.userId, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });

    if (dto.action === 'CHECK_OUT') {
      if (!openAttendance) throw new BadRequestException('ورود بازی برای ثبت خروج وجود ندارد.');
      return db.attendance.update({ where: { id: openAttendance.id }, data: { checkOutAt: new Date() } });
    }
    if (openAttendance) return openAttendance;
    return db.attendance.create({
      data: {
        tenantId: device.tenantId,
        userId: credential.userId,
        membershipId: membership.id,
        deviceId: device.id,
        method: ATTENDANCE_METHOD[dto.type],
      },
    });
  }
}
