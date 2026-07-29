import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { SubscriptionAccessService } from './subscription-access.service';

function createService(subscription: any) {
  const tx = {
    tenantSubscription: {
      findUnique: jest.fn().mockResolvedValue(subscription),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    forTenant: jest.fn((callback: (db: typeof tx) => unknown) => callback(tx)),
  } as unknown as PrismaService;
  const context = {
    requireTenantId: () => 'tenant-1',
  } as unknown as TenantContext;
  return {
    service: new SubscriptionAccessService(prisma, context),
    tx,
  };
}

describe('SubscriptionAccessService', () => {
  it('allows a Growth feature while the subscription is active', async () => {
    const { service } = createService({
      id: 'subscription-1',
      status: 'ACTIVE',
      renewsAt: new Date(Date.now() + 86_400_000),
      plan: { code: 'GROWTH', name: 'رشد' },
    });

    await expect(service.requireFeature('DEVICE_INTEGRATION')).resolves.toEqual(
      expect.objectContaining({
        isOperational: true,
        planCode: 'GROWTH',
      }),
    );
  });

  it('marks an elapsed subscription past due and blocks premium writes', async () => {
    const { service, tx } = createService({
      id: 'subscription-1',
      status: 'ACTIVE',
      renewsAt: new Date(Date.now() - 60_000),
      plan: { code: 'GROWTH', name: 'رشد' },
    });

    await expect(
      service.requireFeature('ADVERTISEMENTS'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.tenantSubscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'subscription-1',
          status: 'ACTIVE',
        }),
        data: { status: 'PAST_DUE' },
      }),
    );
  });

  it('enforces the staff quota defined by the current plan', async () => {
    const { service } = createService({
      id: 'subscription-1',
      status: 'ACTIVE',
      renewsAt: new Date(Date.now() + 86_400_000),
      plan: { code: 'STARTER', name: 'شروع' },
    });

    await expect(service.assertCapacity('staff', 3)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.assertCapacity('staff', 2)).resolves.toEqual(
      expect.objectContaining({
        limits: expect.objectContaining({ staff: 3 }),
      }),
    );
  });
});
