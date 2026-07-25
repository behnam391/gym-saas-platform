import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';

describe('SuperAdminService', () => {
  const platform = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: { deleteMany: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const prisma = { forPlatform: () => platform };
  const service = new SuperAdminService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    platform.$transaction.mockImplementation((callback) => callback(platform));
  });

  it('requires at least one access change', async () => {
    await expect(service.setUserAccess('user-1', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('protects super-admin accounts from access changes', async () => {
    platform.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'SUPER_ADMIN', tenantId: null });
    await expect(service.setUserAccess('admin-1', { isActive: false })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('revokes sessions and writes an audit event when deactivating a user', async () => {
    const changed = { id: 'user-1', role: 'ATHLETE', isActive: false, isRestricted: false };
    platform.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'ATHLETE', tenantId: 'tenant-1' });
    platform.user.update.mockResolvedValue(changed);

    await expect(service.setUserAccess('user-1', { isActive: false })).resolves.toEqual(changed);
    expect(platform.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(platform.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        action: 'SUPER_ADMIN_USER_ACCESS_UPDATED',
        entityId: 'user-1',
      }),
    });
  });
});
