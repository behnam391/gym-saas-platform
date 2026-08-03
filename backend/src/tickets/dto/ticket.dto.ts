import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTicketDto {
  @IsIn(['GYM', 'TRAINER', 'NUTRITIONIST', 'PLATFORM'])
  targetType: 'GYM' | 'TRAINER' | 'NUTRITIONIST' | 'PLATFORM';

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsString()
  @IsNotEmpty({ message: 'موضوع تیکت الزامی است.' })
  @MaxLength(150)
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'توضیحات تیکت الزامی است.' })
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
