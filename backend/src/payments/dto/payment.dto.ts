import {
  IsDateString,
  IsIn,
  IsNumber,
  IsInt,
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

export class StartPlatformSubscriptionPaymentDto {
  @IsString()
  @MaxLength(60)
  planCode: string;

  @Type(() => Number)
  @IsInt()
  @IsIn([1, 3, 6, 12], { message: 'دوره اشتراک باید ۱، ۳، ۶ یا ۱۲ ماه باشد.' })
  months: 1 | 3 | 6 | 12;
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
