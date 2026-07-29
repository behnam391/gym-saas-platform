import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkerProcessorModule } from './queue/worker-processor.module';
import { PlatformIntegrationsRuntimeModule } from './integrations/platform-integrations-runtime.module';

/**
 * Minimal module for the standalone worker process (see
 * deploy/docker-compose.yml `worker` service + main-worker.ts). It only
 * pulls in WorkerProcessorModule — no controllers, no HTTP server, no
 * Prisma tenant context — because a worker has no per-request tenant to
 * scope to; it only processes the data already embedded in each job payload.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PlatformIntegrationsRuntimeModule,
    WorkerProcessorModule,
  ],
})
export class WorkerModule {}
