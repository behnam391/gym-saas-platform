import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateFinancialAccountDto {
  @IsIn(['PERSONAL', 'GYM', 'BUFFET', 'TRAINER', 'ADVISOR'])
  scope: 'PERSONAL' | 'GYM' | 'BUFFET' | 'TRAINER' | 'ADVISOR';

  @IsString() @MaxLength(80) label: string;
  @IsOptional() @IsString() @MaxLength(80) bankName?: string;
  @IsString() @MaxLength(120) accountHolder: string;
  @IsOptional() @Matches(/^IR\d{24}$/) iban?: string;
  @IsOptional() @IsString() @MaxLength(40) accountNumber?: string;
  @IsOptional() @Matches(/^\d{16}$/) cardNumber?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
