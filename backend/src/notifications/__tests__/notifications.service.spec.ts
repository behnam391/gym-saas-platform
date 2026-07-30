import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';

function createService(tx: any) {
  tx.pushDevice ??= {
    findMany: jest.fn().mockResolvedValue([]),
  };
  const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
  const context = {
    tenantId: 'tenant-1',
    requireTenantId: jest.fn().mockReturnValue('tenant-1'),
  } as unknown as TenantContext;
  const queue = { add: jest.fn() } as any;
  return { service: new NotificationsService(prisma, context, queue), queue };
}

describe('NotificationsService', () => {
  it('scopes read updates to the authenticated user', async () => {
    const tx = { notification: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    const { service } = createService(tx);

    await expect(service.markRead('user-1', 'notification-1')).resolves.toEqual({ updated: 1 });
    expect(tx.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
      data: { isRead: true },
    });
  });

  it('keeps in-app notifications synchronous and out of the delivery queue', async () => {
    const tx = { notification: { create: jest.fn().mockResolvedValue({ id: 'notification-1' }) } };
    const { service, queue } = createService(tx);

    await service.create({ userId: 'user-1', title: 'برنامه جدید', body: 'برنامه شما آماده است.' });
    expect(tx.notification.create).toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('marks only the authenticated user notifications as read', async () => {
    const tx = { notification: { updateMany: jest.fn().mockResolvedValue({ count: 3 }) } };
    const { service } = createService(tx);

    await expect(service.markAllRead('user-1')).resolves.toEqual({ updated: 3 });
    expect(tx.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
      data: { isRead: true },
    });
  });

  it('queues a deep-linked push for every active device', async () => {
    const tx = {
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
      pushDevice: {
        findMany: jest.fn().mockResolvedValue([
          { expoPushToken: 'ExponentPushToken[device-1]' },
        ]),
      },
    };
    const { service, queue } = createService(tx);

    await service.create({
      userId: 'user-1',
      title: 'بیمه تأیید شد',
      body: 'مدرک شما تأیید شد.',
      metadata: { type: 'INSURANCE_REVIEW' },
    });

    expect(queue.add).toHaveBeenCalledWith('dispatch', {
      channel: 'PUSH',
      to: 'ExponentPushToken[device-1]',
      title: 'بیمه تأیید شد',
      body: 'مدرک شما تأیید شد.',
      data: {
        type: 'INSURANCE_REVIEW',
        notificationId: 'notification-1',
        route: '/insurance',
      },
    });
  });

  it('reactivates a registered device for the current user', async () => {
    const tx = {
      pushDevice: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({ id: 'device-1' }),
      },
    };
    const { service } = createService(tx);

    await service.registerDevice('user-1', {
      expoPushToken: 'ExponentPushToken[device-1]',
      platform: 'android',
      deviceName: 'Pixel',
    });

    expect(tx.pushDevice.upsert).toHaveBeenCalledWith({
      where: { expoPushToken: 'ExponentPushToken[device-1]' },
      create: expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
      update: expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        isActive: true,
      }),
    });
  });
});
