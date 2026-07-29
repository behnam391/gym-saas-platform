import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordManualPaymentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsIn(['CASH', 'POS'])
  method: 'CASH' | 'POS';

  @IsOptional()
  @IsString()
  gatewayRef?: string;
}

export class FinanceDashboardQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'تاریخ شروع نامعتبر است.' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاریخ پایان نامعتبر است.' })
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'])
  status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

  @IsOptional()
  @IsIn(['ONLINE_GATEWAY', 'CASH', 'POS', 'WALLET'])
  method?: 'ONLINE_GATEWAY' | 'CASH' | 'POS' | 'WALLET';

  @IsOptional()
  @IsIn(['MEMBERSHIP', 'CAFETERIA', 'OTHER'])
  source?: 'MEMBERSHIP' | 'CAFETERIA' | 'OTHER';
}
