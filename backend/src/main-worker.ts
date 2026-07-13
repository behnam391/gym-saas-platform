import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  // createApplicationContext, not create() — no HTTP listener needed.
  await NestFactory.createApplicationContext(WorkerModule);
  console.log('Notification worker started — consuming BullMQ jobs.');
}
bootstrap();
