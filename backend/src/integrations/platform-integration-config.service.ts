import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createCipheriv,
  createHash,
  createDecipheriv,
  randomBytes,
} from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface PaymentGatewayConfig {
  merchantId: string;
  sandbox: boolean;
  callbackUrl: string;
}

export interface SmsGatewayConfig {
  apiKey: string;
  sender?: string;
  otpTemplate?: string;
  allowedRecipients: string[];
  dryRun: boolean;
}

type IntegrationConfig = PaymentGatewayConfig | SmsGatewayConfig;

@Injectable()
export class PlatformIntegrationConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentGatewayConfig(): Promise<PaymentGatewayConfig | null> {
    const stored = await this.read<PaymentGatewayConfig>('PAYMENT_GATEWAY');
    if (stored?.merchantId) return stored;
    const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
    if (!merchantId) return null;
    return {
      merchantId,
      sandbox: process.env.ZARINPAL_SANDBOX === 'true',
      callbackUrl:
        process.env.ZARINPAL_CALLBACK_URL?.trim() ||
        `${process.env.PUBLIC_API_ORIGIN?.replace(/\/$/, '')}/api/v1/payments/zarinpal/callback`,
    };
  }

  async getSmsGatewayConfig(): Promise<SmsGatewayConfig | null> {
    const stored = await this.read<SmsGatewayConfig>('SMS');
    if (stored?.apiKey) return stored;
    const apiKey =
      process.env.KAVENEGAR_API_KEY?.trim() ||
      process.env.SMS_PROVIDER_API_KEY?.trim();
    if (!apiKey) return null;
    return {
      apiKey,
      sender: process.env.KAVENEGAR_SENDER?.trim() || undefined,
      otpTemplate: process.env.KAVENEGAR_OTP_TEMPLATE?.trim() || undefined,
      allowedRecipients: (process.env.KAVENEGAR_ALLOWED_RECIPIENTS ?? '')
        .split(',')
        .map((value) => this.normalizeMobile(value))
        .filter(Boolean),
      dryRun: process.env.KAVENEGAR_DRY_RUN !== 'false',
    };
  }

  async read<T extends IntegrationConfig>(key: string): Promise<T | null> {
    const integration = await this.prisma
      .forPlatform()
      .platformIntegration.findUnique({
        where: { key },
        select: { encryptedConfig: true },
      });
    if (!integration?.encryptedConfig) return null;
    return this.decrypt<T>(integration.encryptedConfig);
  }

  async save(
    key: string,
    config: IntegrationConfig,
    configuredFields: string[],
  ) {
    return this.prisma.forPlatform().platformIntegration.update({
      where: { key },
      data: {
        encryptedConfig: this.encrypt(config),
        configuredFields,
        status: 'CONFIGURED',
      },
    });
  }

  normalizeMobile(value: string) {
    if (value.trim() === '*') return '*';
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('0098')) return `0${digits.slice(4)}`;
    if (digits.startsWith('98')) return `0${digits.slice(2)}`;
    return digits;
  }

  private encryptionKey() {
    const encoded = process.env.PLATFORM_SECRETS_KEY?.trim();
    if (!encoded) {
      if (process.env.NODE_ENV !== 'production' && process.env.JWT_REFRESH_SECRET) {
        return createHash('sha256')
          .update(`gordyar-integrations:${process.env.JWT_REFRESH_SECRET}`)
          .digest();
      }
      throw new ServiceUnavailableException(
        'کلید رمزگذاری تنظیمات سامانه روی سرور تنظیم نشده است.',
      );
    }
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== 32) {
      throw new ServiceUnavailableException(
        'کلید رمزگذاری تنظیمات سامانه معتبر نیست.',
      );
    }
    return key;
  }

  private encrypt(value: IntegrationConfig) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  }

  private decrypt<T>(payload: string): T {
    const [version, iv, tag, ciphertext] = payload.split('.');
    if (version !== 'v1' || !iv || !tag || !ciphertext) {
      throw new ServiceUnavailableException('ساختار تنظیمات رمزگذاری‌شده معتبر نیست.');
    }
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey(),
        Buffer.from(iv, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64url')),
        decipher.final(),
      ]);
      return JSON.parse(plaintext.toString('utf8')) as T;
    } catch {
      throw new ServiceUnavailableException('بازکردن تنظیمات امن سامانه ممکن نشد.');
    }
  }
}
