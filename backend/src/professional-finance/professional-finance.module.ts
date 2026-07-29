import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfessionalFinanceController } from './professional-finance.controller';
import { ProfessionalFinanceService } from './professional-finance.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessionalFinanceController],
  providers: [ProfessionalFinanceService],
})
export class ProfessionalFinanceModule {}
