import { IsIn, IsString } from 'class-validator';

export const UPLOAD_PURPOSES = [
  'PROFILE_IMAGE',
  'GYM_GALLERY',
  'GYM_VIDEO',
  'INSURANCE_DOCUMENT',
  'PARENTAL_CONSENT',
  'TRAINER_CERTIFICATE',
  'NUTRITIONIST_CERTIFICATE',
  'NUTRITIONIST_NATIONAL_ID',
  'PRODUCT_IMAGE',
  'HERO_SLIDE',
] as const;

export class RequestUploadUrlDto {
  @IsIn(UPLOAD_PURPOSES, { message: 'هدف آپلود نامعتبر است.' })
  purpose: (typeof UPLOAD_PURPOSES)[number];

  @IsString()
  fileName: string;

  @IsString()
  contentType: string;
}
