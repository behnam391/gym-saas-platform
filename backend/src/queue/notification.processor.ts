import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from './queue.module';
import { NotificationProviderService } from './notification-provider.service';

export interface NotificationJobData {
  channel: 'SMS' | 'EMAIL' | 'PUSH';
  to: string; // mobile or email depending on channel
  title: string;
  body: string;
}

/**
 * Runs as a SEPARATE PROCESS in production (see deploy/docker-compose.yml
 * `worker` service), not inside the same process serving HTTP requests —
 * so a slow/flaky SMS gateway never blocks API responses.
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly provider: NotificationProviderService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { channel, to, title, body } = job.data;

    switch (channel) {
      case 'SMS':
        await this.provider.sendSms({ to, text: `${title}\n${body}` });
        break;
      case 'EMAIL':
        await this.provider.sendEmail({ to, subject: title, html: body });
        break;
      case 'PUSH':
        // Web/mobile push left as an extension point (e.g. Firebase Cloud
        // Messaging) — same pattern as sendSms/sendEmail above.
        this.logger.warn(`PUSH channel not yet wired for ${to}`);
        break;
    }
  }
}
