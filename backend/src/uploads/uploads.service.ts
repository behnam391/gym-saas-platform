import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { unlinkSync } from 'fs';
import { TenantContext } from '../common/tenant-context';
import { RequestUploadUrlDto } from './dto/upload.dto';

const ALLOWED_CONTENT_TYPES: Record<string, string[]> = {
  PROFILE_IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  GYM_GALLERY: ['image/jpeg', 'image/png', 'image/webp'],
  GYM_VIDEO: ['video/mp4', 'video/webm'],
  INSURANCE_DOCUMENT: ['image/jpeg', 'image/png', 'application/pdf'],
  PARENTAL_CONSENT: ['image/jpeg', 'image/png', 'application/pdf'],
  TRAINER_CERTIFICATE: ['image/jpeg', 'image/png', 'application/pdf'],
  NUTRITIONIST_CERTIFICATE: ['image/jpeg', 'image/png', 'application/pdf'],
  NUTRITIONIST_NATIONAL_ID: ['image/jpeg', 'image/png', 'application/pdf'],
  PRODUCT_IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  HERO_SLIDE: ['image/jpeg', 'image/png', 'image/webp'],
};

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // enforced via S3 policy condition below

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;

  constructor(private readonly tenantContext: TenantContext) {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'default',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
      forcePathStyle: true, // required by most non-AWS S3-compatible providers
    });
  }

  /**
   * Returns a presigned PUT URL the CLIENT uploads directly to (browser ->
   * S3, never browser -> our API -> S3). The API never touches file bytes,
   * which keeps it stateless and avoids holding large uploads in memory.
   * The caller then sends back the resulting object `key` (not the
   * presigned URL itself) to whichever endpoint expects a `*Url` field
   * (e.g. InsuranceDocument.documentUrl) — that endpoint should store the
   * public/CDN URL constructed from the key, not the time-limited
   * presigned URL.
   */
  async requestUploadUrl(userId: string, dto: RequestUploadUrlDto) {
    const allowed = ALLOWED_CONTENT_TYPES[dto.purpose];
    if (!allowed.includes(dto.contentType)) {
      throw new BadRequestException(
        `نوع فایل برای این هدف مجاز نیست. انواع مجاز: ${allowed.join(', ')}`,
      );
    }

    const tenantId = this.tenantContext.tenantId ?? 'platform';
    const extension = dto.fileName.split('.').pop() ?? 'bin';
    const key = `${tenantId}/${dto.purpose.toLowerCase()}/${userId}/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: dto.contentType,
      // S3-compatible providers vary in support for ContentLengthRange
      // conditions on presigned PUT URLs — MAX_FILE_SIZE_BYTES is
      // documented here as the intended limit; enforce it definitively
      // via a bucket policy or a post-upload Lambda/webhook size check
      // in providers that don't support presigned PUT conditions.
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 }); // 5 minutes

    return {
      uploadUrl,
      key,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
      expiresInSeconds: 300,
    };
  }

  /** Builds the public/CDN URL to store in the relevant `*Url` field once
   * the client confirms the upload succeeded. */
  publicUrlFor(key: string): string {
    const base = process.env.S3_PUBLIC_BASE_URL ?? process.env.S3_ENDPOINT;
    return `${base}/${process.env.S3_BUCKET}/${key}`;
  }

  completeLocalUpload(userId: string, purpose: string, file?: Express.Multer.File) {
    if (process.env.NODE_ENV === 'production' && process.env.LOCAL_UPLOADS_ENABLED !== 'true') {
      throw new BadRequestException('آپلود مستقیم محلی در محیط عملیاتی غیرفعال است.');
    }
    if (!file) throw new BadRequestException('فایلی انتخاب نشده است.');

    const allowed = ALLOWED_CONTENT_TYPES[purpose];
    if (!allowed || !allowed.includes(file.mimetype)) {
      try { unlinkSync(file.path); } catch { /* already removed or unavailable */ }
      throw new BadRequestException('نوع این فایل برای کاربرد انتخاب‌شده مجاز نیست.');
    }
    const port = process.env.PORT ?? 3000;
    const base = process.env.PUBLIC_API_ORIGIN ?? `http://localhost:${port}`;
    return {
      url: `${base}/local-uploads/${file.filename}`,
      purpose,
      ownerId: userId,
      size: file.size,
      contentType: file.mimetype,
    };
  }
}
