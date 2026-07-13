import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { NOTIFICATION_QUEUE } from '../queue/queue.module';
import { NotificationJobData } from '../queue/notification.processor';

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
    const notification = await this.prisma.forTenant((tx) =>
      tx.notification.create({
        data: {
          tenantId: this.tenantContext.tenantId,
          userId: input.userId,
          title: input.title,
          body: input.body,
          channel: (input.channel ?? 'IN_APP') as any,
          metadata: input.metadata as any,
        },
      }),
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

  listMine(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  markRead(notificationId: string) {
    return this.prisma.forTenant((tx) =>
      tx.notification.update({ where: { id: notificationId }, data: { isRead: true } }),
    );
  }
}
