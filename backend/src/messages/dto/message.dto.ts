import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID('4', { message: 'شناسه گیرنده نامعتبر است.' })
  recipientId: string;

  @IsString()
  @MinLength(1, { message: 'متن پیام نمی‌تواند خالی باشد.' })
  @MaxLength(4000, { message: 'متن پیام بیش از حد طولانی است.' })
  body: string;
}

