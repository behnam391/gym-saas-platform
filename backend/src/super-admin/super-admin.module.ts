import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformIntegrationsAdminService } from './platform-integrations-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, PlatformIntegrationsAdminService],
})
export class SuperAdminModule {}
