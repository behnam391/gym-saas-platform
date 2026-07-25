import { UnauthorizedException } from '@nestjs/common';
import { AttendanceDevicesService } from './attendance-devices.service';

describe('AttendanceDevicesService', () => {
  const tenantId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const tx = {
    user: { findUnique: jest.fn() },
    attendanceCredential: { upsert: jest.fn() },
  };
  const prisma = {
    forTenant: (callback: (client: typeof tx) => unknown) => callback(tx),
    forPlatform: jest.fn(),
  };
  const tenantContext = { requireTenantId: () => tenantId };
  const service = new AttendanceDevicesService(prisma as never, tenantContext as never);

  beforeEach(() => jest.clearAllMocks());

  it('never stores the raw biometric or device identifier', async () => {
    tx.user.findUnique.mockResolvedValue({ id: 'user-1' });
    tx.attendanceCredential.upsert.mockResolvedValue({ id: 'credential-1' });

    await service.addCredential({
      userId: 'user-1',
      type: 'FINGERPRINT',
      identifier: 'vendor-template-123456',
      label: 'اثر انگشت اصلی',
    });

    const args = tx.attendanceCredential.upsert.mock.calls[0][0];
    expect(args.create.identifierHash).toMatch(/^[a-f0-9]{64}$/);
    expect(args.create.identifierHash).not.toContain('vendor-template-123456');
    expect(args.create).not.toHaveProperty('identifier');
    expect(args.create.identifierLast4).toBe('3456');
  });

  it('rejects attendance events without a device key', async () => {
    await expect(service.ingest(undefined, {
      type: 'NFC_PHONE',
      identifier: 'phone-token',
      action: 'CHECK_IN',
    })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
