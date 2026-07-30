import { Module } from '@nestjs/common';
import { QueueModule } from './queue.module';
import { NotificationProcessor } from './notification.processor';
import { NotificationProviderService } from './notification-provider.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [QueueModule, PrismaModule],
  providers: [NotificationProcessor, NotificationProviderService],
})
export class WorkerProcessorModule {}
