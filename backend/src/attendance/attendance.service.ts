import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CheckInDto } from './dto/check-in.dto';

const CROWD_CAPACITY_DEFAULT = 80; // overridable per-tenant in a future settings table
const PASS_TTL_SECONDS = 30;

type AttendancePassPayload = {
  tenantId: string;
  userId: string;
  membershipId: string;
};

function passDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AttendanceService implements OnModuleDestroy {
  private readonly redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  onModuleDestroy() {
    this.redis.disconnect();
  }

  async issuePass(userId: string) {
    const passData = await this.prisma.forTenant(async (tx) => {
      const membership = await tx.membership.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { title: true } },
          tenant: { select: { id: true, name: true, slug: true } },
          user: {
            select: {
              firstName: true,
              lastName: true,
              isActive: true,
              isRestricted: true,
            },
          },
        },
      });
      if (!membership) {
        throw new BadRequestException('عضویت فعال و معتبر برای صدور گُردیار Pass وجود ندارد.');
      }
      if (!membership.user.isActive || membership.user.isRestricted) {
        throw new ForbiddenException('حساب ورزشکار برای ورود مکانیزه مجاز نیست.');
      }
      return membership;
    });

    const token = randomBytes(32).toString('base64url');
    const digest = passDigest(token);
    const passKey = `attendance:pass:${digest}`;
    const activeKey = `attendance:pass:active:${passData.tenant.id}:${userId}`;
    const payload: AttendancePassPayload = {
      tenantId: passData.tenant.id,
      userId,
      membershipId: passData.id,
    };

    try {
      await this.redis.eval(
        `
          local oldDigest = redis.call('GET', KEYS[1])
          if oldDigest then
            redis.call('DEL', 'attendance:pass:' .. oldDigest)
          end
          redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
          redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[3])
          return 1
        `,
        2,
        activeKey,
        passKey,
        digest,
        JSON.stringify(payload),
        PASS_TTL_SECONDS,
      );
    } catch {
      throw new ServiceUnavailableException('سامانه صدور Pass موقتاً در دسترس نیست.');
    }

    return {
      token,
      expiresAt: new Date(Date.now() + PASS_TTL_SECONDS * 1000).toISOString(),
      expiresInSeconds: PASS_TTL_SECONDS,
      athleteName: `${passData.user.firstName} ${passData.user.lastName}`,
      gym: passData.tenant,
      planTitle: passData.plan.title,
    };
  }

  async redeemPass(operatorId: string, token: string) {
    const digest = passDigest(token);
    let rawPayload: unknown;
    try {
      rawPayload = await this.redis.eval(
        `
          local value = redis.call('GET', KEYS[1])
          if value then redis.call('DEL', KEYS[1]) end
          return value
        `,
        1,
        `attendance:pass:${digest}`,
      );
    } catch {
      throw new ServiceUnavailableException('سامانه اعتبارسنجی Pass موقتاً در دسترس نیست.');
    }
    if (typeof rawPayload !== 'string') {
      throw new BadRequestException('این Pass منقضی شده یا قبلاً استفاده شده است.');
    }

    let payload: AttendancePassPayload;
    try {
      payload = JSON.parse(rawPayload) as AttendancePassPayload;
    } catch {
      throw new BadRequestException('محتوای Pass معتبر نیست.');
    }
    const tenantId = this.tenantContext.requireTenantId();
    if (payload.tenantId !== tenantId) {
      throw new ForbiddenException('این Pass متعلق به باشگاه دیگری است.');
    }

    return this.prisma.forTenant(async (tx) => {
      const membership = await tx.membership.findFirst({
        where: {
          id: payload.membershipId,
          userId: payload.userId,
          status: 'ACTIVE',
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        include: {
          user: { select: { firstName: true, lastName: true, isActive: true, isRestricted: true } },
        },
      });
      if (!membership || !membership.user.isActive || membership.user.isRestricted) {
        throw new BadRequestException('عضویت یا حساب ورزشکار دیگر معتبر نیست.');
      }

      const openAttendance = await tx.attendance.findFirst({
        where: { userId: payload.userId, checkOutAt: null },
        orderBy: { checkInAt: 'desc' },
      });
      if (openAttendance) {
        const attendance = await tx.attendance.update({
          where: { id: openAttendance.id },
          data: { checkOutAt: new Date() },
        });
        return {
          action: 'CHECK_OUT',
          attendance,
          athleteName: `${membership.user.firstName} ${membership.user.lastName}`,
        };
      }

      const attendance = await tx.attendance.create({
        data: {
          tenantId,
          userId: payload.userId,
          membershipId: membership.id,
          method: 'QR_CODE',
          operatorId,
        },
      });
      return {
        action: 'CHECK_IN',
        attendance,
        athleteName: `${membership.user.firstName} ${membership.user.lastName}`,
      };
    });
  }

  /**
   * Every query here runs through `forTenant()`, which:
   *  (a) opens a transaction,
   *  (b) sets the RLS session variable for the CURRENT request's tenant,
   *  (c) only then executes the query.
   * There is no `tenantId` filter written by hand below — and that's the
   * point: even if a future developer forgets one, Postgres RLS still
   * blocks any cross-tenant row from coming back.
   */
  checkIn(operatorId: string, dto: CheckInDto) {
    return this.prisma.forTenant(async (tx) => {
      const member = await tx.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, isActive: true, isRestricted: true },
      });
      if (!member?.isActive || member.isRestricted) {
        throw new BadRequestException('حساب این عضو فعال نیست یا هنوز محدودیت مدارک دارد.');
      }

      const membership = await tx.membership.findFirst({
        where: {
          ...(dto.membershipId ? { id: dto.membershipId } : {}),
          userId: dto.userId,
          status: 'ACTIVE',
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!membership) {
        throw new BadRequestException('عضویت فعال و معتبر برای این کاربر یافت نشد.');
      }

      const openSession = await tx.attendance.findFirst({
        where: { userId: dto.userId, checkOutAt: null },
      });
      if (openSession) {
        throw new BadRequestException(
          'این کاربر در حال حاضر یک حضور باز دارد. ابتدا خروج ثبت شود.',
        );
      }

      return tx.attendance.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          userId: dto.userId,
          membershipId: membership.id,
          method: dto.method as any,
          operatorId,
        },
      });
    });
  }

  checkOut(attendanceId: string) {
    return this.prisma.forTenant((tx) =>
      tx.attendance.update({
        where: { id: attendanceId },
        data: { checkOutAt: new Date() },
      }),
    );
  }

  async getCrowdStatus() {
    return this.prisma.forTenant(async (tx) => {
      const activeCount = await tx.attendance.count({
        where: { checkOutAt: null },
      });
      const capacity = CROWD_CAPACITY_DEFAULT;
      const ratio = activeCount / capacity;
      const level = ratio < 0.4 ? 'GREEN' : ratio < 0.75 ? 'YELLOW' : 'RED';

      await tx.crowdSnapshot.create({
        data: {
          activeCount,
          capacity,
          level,
          tenantId: this.tenantContext.requireTenantId(),
        },
      });

      return { activeCount, capacity, level };
    });
  }

  listRecent() {
    return this.prisma.forTenant((tx) =>
      tx.attendance.findMany({
        include: {
          user: { select: { id: true, firstName: true, lastName: true, mobile: true } },
          membership: { include: { plan: true } },
        },
        orderBy: { checkInAt: 'desc' },
        take: 200,
      }),
    );
  }
}
