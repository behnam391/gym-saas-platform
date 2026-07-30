import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const EXPO_PUSH_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export class RegisterPushDeviceDto {
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'شناسه اعلان Expo معتبر نیست.',
  })
  expoPushToken: string;

  @IsIn(['android', 'ios'])
  platform: 'android' | 'ios';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;
}

export class UnregisterPushDeviceDto {
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'شناسه اعلان Expo معتبر نیست.',
  })
  expoPushToken: string;
}
