import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CheckInDto } from './dto/check-in.dto';

const CROWD_CAPACITY_DEFAULT = 80; // overridable per-tenant in a future settings table

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

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
          membershipId: dto.membershipId,
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
}
