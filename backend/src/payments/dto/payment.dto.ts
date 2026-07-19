import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
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

