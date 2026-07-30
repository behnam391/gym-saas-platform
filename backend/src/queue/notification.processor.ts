import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationProviderService } from './notification-provider.service';
import { NOTIFICATION_QUEUE } from './queue.module';

export interface NotificationJobData {
  channel: 'SMS' | 'EMAIL' | 'PUSH';
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushReceiptJobData {
  channel: 'PUSH_RECEIPT';
  to: string;
  receiptId: string;
}

export type NotificationQueueJobData =
  | NotificationJobData
  | PushReceiptJobData;

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly provider: NotificationProviderService,
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue<NotificationQueueJobData>,
  ) {
    super();
  }

  async process(job: Job<NotificationQueueJobData>): Promise<void> {
    if (job.data.channel === 'PUSH_RECEIPT') {
      const result = await this.provider.checkPushReceipt(job.data.receiptId);
      if (result.deviceNotRegistered) {
        await this.deactivatePushToken(job.data.to);
      }
      return;
    }

    const { channel, to, title, body, data } = job.data;
    switch (channel) {
      case 'SMS':
        await this.provider.sendSms({ to, text: `${title}\n${body}` });
        break;
      case 'EMAIL':
        await this.provider.sendEmail({ to, subject: title, html: body });
        break;
      case 'PUSH': {
        const result = await this.provider.sendPush({
          to,
          title,
          body,
          data,
        });
        if (result.deviceNotRegistered) {
          await this.deactivatePushToken(to);
        } else if (result.receiptId) {
          await this.notificationQueue.add(
            'push-receipt',
            {
              channel: 'PUSH_RECEIPT',
              to,
              receiptId: result.receiptId,
            },
            {
              delay: 15 * 60 * 1_000,
              attempts: 4,
              backoff: { type: 'exponential', delay: 60_000 },
            },
          );
        }
        break;
      }
    }
  }

  private async deactivatePushToken(expoPushToken: string) {
    await this.prisma.forPlatform().pushDevice.updateMany({
      where: { expoPushToken },
      data: { isActive: false },
    });
    this.logger.warn('[Push device deactivated after provider rejection]');
  }
}
