import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { ConflictException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  it('notifies a minor after approving parental consent', async () => {
    const consent = {
      id: 'consent-1',
      userId: 'athlete-1',
      status: 'APPROVED',
    };
    const tx = {
      parentalConsent: {
        findUnique: jest.fn().mockResolvedValue({ ...consent, status: 'PENDING' }),
        update: jest.fn().mockResolvedValue(consent),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
    const notifications = {
      create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
    } as unknown as NotificationsService;
    const service = new TenantsService(
      prisma,
      new TenantContext(),
      notifications,
    );

    await service.reviewParentalConsent('athlete-1', 'owner-1', {
      status: 'APPROVED',
    });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'athlete-1' },
      data: { isRestricted: false },
    });
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'athlete-1',
        metadata: expect.objectContaining({
          type: 'PARENTAL_CONSENT_REVIEW',
          status: 'APPROVED',
        }),
      }),
    );
  });

  it('does not review an already-approved parental consent again', async () => {
    const tx = {
      parentalConsent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'consent-1',
          userId: 'athlete-1',
          status: 'APPROVED',
        }),
        update: jest.fn(),
      },
      user: { update: jest.fn() },
    };
    const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
    const notifications = { create: jest.fn() } as unknown as NotificationsService;
    const service = new TenantsService(
      prisma,
      new TenantContext(),
      notifications,
    );

    await expect(
      service.reviewParentalConsent('athlete-1', 'owner-1', {
        status: 'REJECTED',
        rejectionReason: 'مدرک ناخوانا است.',
      }),
    ).rejects.toThrow(ConflictException);
    expect(tx.parentalConsent.update).not.toHaveBeenCalled();
    expect(notifications.create).not.toHaveBeenCalled();
  });
});
