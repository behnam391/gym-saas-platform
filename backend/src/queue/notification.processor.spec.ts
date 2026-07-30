import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationProcessor } from './notification.processor';
import { NotificationProviderService } from './notification-provider.service';

describe('NotificationProcessor push delivery', () => {
  it('schedules a receipt check after Expo accepts a push', async () => {
    const provider = {
      sendPush: jest.fn().mockResolvedValue({
        receiptId: 'receipt-1',
        deviceNotRegistered: false,
      }),
    } as unknown as NotificationProviderService;
    const prisma = {
      forPlatform: jest.fn(),
    } as unknown as PrismaService;
    const queue = { add: jest.fn() } as unknown as Queue;
    const processor = new NotificationProcessor(provider, prisma, queue);

    await processor.process({
      data: {
        channel: 'PUSH',
        to: 'ExponentPushToken[device-1]',
        title: 'عنوان',
        body: 'متن',
        data: { route: '/notifications' },
      },
    } as Job);

    expect(queue.add).toHaveBeenCalledWith(
      'push-receipt',
      {
        channel: 'PUSH_RECEIPT',
        to: 'ExponentPushToken[device-1]',
        receiptId: 'receipt-1',
      },
      expect.objectContaining({ delay: 15 * 60 * 1_000 }),
    );
  });

  it('deactivates a token rejected by the push provider', async () => {
    const provider = {
      sendPush: jest.fn().mockResolvedValue({
        deviceNotRegistered: true,
      }),
    } as unknown as NotificationProviderService;
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      forPlatform: jest.fn().mockReturnValue({
        pushDevice: { updateMany },
      }),
    } as unknown as PrismaService;
    const queue = { add: jest.fn() } as unknown as Queue;
    const processor = new NotificationProcessor(provider, prisma, queue);

    await processor.process({
      data: {
        channel: 'PUSH',
        to: 'ExponentPushToken[expired-device]',
        title: 'عنوان',
        body: 'متن',
      },
    } as Job);

    expect(updateMany).toHaveBeenCalledWith({
      where: { expoPushToken: 'ExponentPushToken[expired-device]' },
      data: { isActive: false },
    });
  });
});
