import { Module } from '@nestjs/common';
import { QueueModule } from './queue.module';
import { NotificationProcessor } from './notification.processor';
import { NotificationProviderService } from './notification-provider.service';

@Module({
  imports: [QueueModule],
  providers: [NotificationProcessor, NotificationProviderService],
})
export class WorkerProcessorModule {}
