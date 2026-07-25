import { BadRequestException } from '@nestjs/common';
import { AttendanceService } from '../attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';

function createService(tx: any) {
  const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
  const context = { requireTenantId: () => 'tenant-1' } as unknown as TenantContext;
  return new AttendanceService(prisma, context);
}

describe('AttendanceService.checkIn', () => {
  it('rejects restricted members before checking membership', async () => {
    const tx = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', isActive: true, isRestricted: true }) } };
    const service = createService(tx);
    await expect(service.checkIn('operator-1', { userId: 'user-1', method: 'MANUAL' as any })).rejects.toThrow(BadRequestException);
  });

  it('rejects members without an active membership', async () => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', isActive: true, isRestricted: false }) },
      membership: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = createService(tx);
    await expect(service.checkIn('operator-1', { userId: 'user-1', method: 'MANUAL' as any })).rejects.toThrow(BadRequestException);
  });

  it('records the verified active membership on attendance', async () => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', isActive: true, isRestricted: false }) },
      membership: { findFirst: jest.fn().mockResolvedValue({ id: 'membership-1' }) },
      attendance: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'attendance-1' }) },
    };
    const service = createService(tx);
    await service.checkIn('operator-1', { userId: 'user-1', method: 'MANUAL' as any });
    expect(tx.attendance.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId: 'tenant-1', membershipId: 'membership-1', operatorId: 'operator-1' }) });
  });
});
