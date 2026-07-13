import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

export const NOTIFICATION_QUEUE = 'notifications';

/**
 * Producer-only registration: lets any module (e.g. NotificationsModule in
 * the API process) `@InjectQueue()` and call `.add()` to enqueue jobs.
 * The actual consumer (NotificationProcessor) is registered separately in
 * `WorkerProcessorModule`, imported ONLY by `worker.module.ts` — so the API
 * process never also competes for jobs off this queue, keeping the
 * decoupling between "accept the request" and "actually send the SMS" real.
 */
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 86_400 }, // keep 24h for debugging, then drop
        removeOnFail: false, // keep failed jobs for manual inspection/alerting
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
