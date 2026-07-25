import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantStaffController } from './tenant-staff.controller';
import { TenantStaffService } from './tenant-staff.service';

@Module({
  imports: [PrismaModule],
  controllers: [TenantStaffController],
  providers: [TenantStaffService],
})
export class TenantStaffModule {}
