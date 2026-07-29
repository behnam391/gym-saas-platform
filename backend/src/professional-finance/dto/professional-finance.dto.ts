import {
  ContractBillingCycle,
  PaymentMethod,
  ProfessionalContractStatus,
  ProfessionalContractType,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProfessionalContractDto {
  @IsUUID()
  professionalId: string;

  @IsEnum(ProfessionalContractType)
  type: ProfessionalContractType;

  @IsEnum(ContractBillingCycle)
  billingCycle: ContractBillingCycle;

  @IsOptional() @IsNumber() @Min(0)
  fixedAmount?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  sharePercent?: number;

  @IsOptional() @IsNumber() @Min(0)
  perClientAmount?: number;

  @IsDateString()
  startDate: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

export class SetProfessionalContractStatusDto {
  @IsEnum(ProfessionalContractStatus)
  status: ProfessionalContractStatus;
}

export class CreateProfessionalSettlementDto {
  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional() @IsNumber() @Min(0)
  baseRevenue?: number;

  @IsOptional() @IsNumber() @Min(0)
  deductions?: number;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

export class MarkProfessionalSettlementPaidDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional() @IsString() @MaxLength(150)
  paymentRef?: string;
}
