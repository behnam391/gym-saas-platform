import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { QueueModule } from '../queue/queue.module';
import { ZarinpalService } from './zarinpal.service';
import { ZarinpalCallbackController } from './zarinpal-callback.controller';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [PaymentsController, ZarinpalCallbackController],
  providers: [PaymentsService, ZarinpalService],
})
export class PaymentsModule {}
