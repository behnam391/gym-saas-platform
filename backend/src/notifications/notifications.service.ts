import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { NOTIFICATION_QUEUE } from '../queue/queue.module';
import { NotificationJobData } from '../queue/notification.processor';
import { RegisterPushDeviceDto } from './dto/push-device.dto';

interface CreateNotificationInput {
  userId: string;
  userMobile?: string; // required if channel is SMS
  userEmail?: string; // required if channel is EMAIL
  title: string;
  body: string;
  channel?: 'IN_APP' | 'SMS' | 'EMAIL' | 'PUSH';
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue<NotificationJobData>,
  ) {}

  /**
   * Writes the in-app Notification row synchronously (cheap, always
   * needed for the bell icon / notification center), then — for any
   * channel that requires actually contacting the user externally —
   * enqueues a BullMQ job instead of calling the SMS/Email provider
   * inline. This means a slow or temporarily-down gateway never blocks
   * the request that triggered the notification (e.g. insurance
   * approval, ticket update), and failed sends retry automatically
   * (see QueueModule's defaultJobOptions).
   */
  async create(input: CreateNotificationInput) {
    const { notification, pushDevices } = await this.prisma.forTenant(
      async (tx) => {
        const notification = await tx.notification.create({
          data: {
            tenantId: this.tenantContext.tenantId,
            userId: input.userId,
            title: input.title,
            body: input.body,
            channel: (input.channel ?? 'IN_APP') as any,
            metadata: input.metadata as any,
          },
        });
        const pushDevices = await tx.pushDevice.findMany({
          where: { userId: input.userId, isActive: true },
          select: { expoPushToken: true },
        });
        return { notification, pushDevices };
      },
    );

    const pushData = {
      ...(input.metadata ?? {}),
      notificationId: notification.id,
      route: this.routeFor(input.metadata),
    };
    await Promise.all(
      pushDevices.map((device) =>
        this.notificationQueue.add('dispatch', {
          channel: 'PUSH',
          to: device.expoPushToken,
          title: input.title,
          body: input.body,
          data: pushData,
        }),
      ),
    );

    if (input.channel === 'SMS' && input.userMobile) {
      await this.notificationQueue.add('dispatch', {
        channel: 'SMS',
        to: input.userMobile,
        title: input.title,
        body: input.body,
      });
    } else if (input.channel === 'EMAIL' && input.userEmail) {
      await this.notificationQueue.add('dispatch', {
        channel: 'EMAIL',
        to: input.userEmail,
        title: input.title,
        body: input.body,
      });
    }

    return notification;
  }

  registerDevice(userId: string, dto: RegisterPushDeviceDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.forTenant((tx) =>
      tx.pushDevice.upsert({
        where: { expoPushToken: dto.expoPushToken },
        create: {
          tenantId,
          userId,
          expoPushToken: dto.expoPushToken,
          platform: dto.platform,
          deviceName: dto.deviceName?.trim() || null,
        },
        update: {
          tenantId,
          userId,
          platform: dto.platform,
          deviceName: dto.deviceName?.trim() || null,
          isActive: true,
          lastSeenAt: new Date(),
        },
      }),
    );
  }

  unregisterDevice(userId: string, expoPushToken: string) {
    return this.prisma.forTenant(async (tx) => {
      const result = await tx.pushDevice.updateMany({
        where: { userId, expoPushToken },
        data: { isActive: false },
      });
      return { updated: result.count };
    });
  }

  listMine(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }

  markAllRead(userId: string) {
    return this.prisma.forTenant(async (tx) => {
      const result = await tx.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return { updated: result.count };
    });
  }

  markRead(userId: string, notificationId: string) {
    return this.prisma.forTenant(async (tx) => {
      const result = await tx.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
      return { updated: result.count };
    });
  }

  private routeFor(metadata?: Record<string, unknown>) {
    switch (metadata?.type) {
      case 'INSURANCE_REVIEW':
        return '/insurance';
      case 'PARENTAL_CONSENT_REVIEW':
        return '/parental-consent';
      default:
        return '/notifications';
    }
  }
}
