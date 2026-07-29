import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformIntegrationConfigService } from './platform-integration-config.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PlatformIntegrationConfigService],
  exports: [PlatformIntegrationConfigService],
})
export class PlatformIntegrationsRuntimeModule {}
