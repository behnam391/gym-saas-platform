import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentGatewayConfig,
  PlatformIntegrationConfigService,
  SmsGatewayConfig,
} from '../integrations/platform-integration-config.service';
import { SaveIntegrationCredentialsDto } from './dto/super-admin.dto';

@Injectable()
export class PlatformIntegrationsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: PlatformIntegrationConfigService,
  ) {}

  async list() {
    const integrations = await this.prisma
      .forPlatform()
      .platformIntegration.findMany({
        select: {
          id: true,
          key: true,
          label: true,
          category: true,
          provider: true,
          status: true,
          baseUrl: true,
          requiredEnvVars: true,
          notes: true,
          configuredFields: true,
          lastCheckedAt: true,
          updatedAt: true,
        },
        orderBy: [{ category: 'asc' }, { label: 'asc' }],
      });

    return Promise.all(
      integrations.map(async (integration) => {
        if (integration.key === 'PAYMENT_GATEWAY') {
          const stored = await this.config
            .read<PaymentGatewayConfig>(integration.key)
            .catch(() => null);
          return {
            ...integration,
            settings: stored
              ? {
                  merchantIdHint: this.mask(stored.merchantId),
                  sandbox: stored.sandbox,
                  callbackUrl: stored.callbackUrl,
                }
              : null,
          };
        }
        if (integration.key === 'SMS') {
          const stored = await this.config
            .read<SmsGatewayConfig>(integration.key)
            .catch(() => null);
          return {
            ...integration,
            settings: stored
              ? {
                  apiKeyHint: this.mask(stored.apiKey),
                  sender: stored.sender ?? '',
                  otpTemplate: stored.otpTemplate ?? '',
                  allowedRecipients: stored.allowedRecipients.join(','),
                  dryRun: stored.dryRun,
                }
              : null,
          };
        }
        return { ...integration, settings: null };
      }),
    );
  }

  async save(
    key: string,
    dto: SaveIntegrationCredentialsDto,
    actorId: string,
  ) {
    const db = this.prisma.forPlatform();
    const integration = await db.platformIntegration.findUnique({ where: { key } });
    if (!integration) throw new NotFoundException('اتصال سامانه یافت نشد.');

    let configuredFields: string[];
    if (key === 'PAYMENT_GATEWAY') {
      const previous = await this.config.read<PaymentGatewayConfig>(key);
      const merchantId = dto.merchantId?.trim() || previous?.merchantId;
      if (!merchantId) throw new BadRequestException('شناسه درگاه زرین‌پال الزامی است.');
      const callbackUrl =
        dto.callbackUrl?.trim() ||
        previous?.callbackUrl ||
        'https://app-api.gordyar.ir/api/v1/payments/zarinpal/callback';
      await this.config.save(
        key,
        {
          merchantId,
          callbackUrl,
          sandbox: dto.sandbox ?? previous?.sandbox ?? false,
        },
        ['merchantId', 'callbackUrl', 'sandbox'],
      );
      configuredFields = ['merchantId', 'callbackUrl', 'sandbox'];
    } else if (key === 'SMS') {
      const previous = await this.config.read<SmsGatewayConfig>(key);
      const apiKey = dto.apiKey?.trim() || previous?.apiKey;
      if (!apiKey) throw new BadRequestException('کلید API کاوه‌نگار الزامی است.');
      const allowedRecipients = (
        dto.allowedRecipients ?? previous?.allowedRecipients.join(',') ?? ''
      )
        .split(',')
        .map((value) => this.config.normalizeMobile(value))
        .filter(Boolean);
      if (!allowedRecipients.length) {
        throw new BadRequestException('حداقل یک شماره مجاز برای پیامک وارد کنید.');
      }
      await this.config.save(
        key,
        {
          apiKey,
          sender: dto.sender?.trim() || previous?.sender || undefined,
          otpTemplate:
            dto.otpTemplate?.trim() || previous?.otpTemplate || undefined,
          allowedRecipients,
          dryRun: dto.dryRun ?? previous?.dryRun ?? true,
        },
        [
          'apiKey',
          'allowedRecipients',
          'dryRun',
          ...(dto.sender || previous?.sender ? ['sender'] : []),
          ...(dto.otpTemplate || previous?.otpTemplate
            ? ['otpTemplate']
            : []),
        ],
      );
      configuredFields = [
        'apiKey',
        'allowedRecipients',
        'dryRun',
        ...(dto.sender || previous?.sender ? ['sender'] : []),
        ...(dto.otpTemplate || previous?.otpTemplate
          ? ['otpTemplate']
          : []),
      ];
    } else {
      throw new BadRequestException('ثبت کلید برای این اتصال هنوز پیاده‌سازی نشده است.');
    }

    await db.auditLog.create({
      data: {
        actorId,
        action: 'PLATFORM_INTEGRATION_CONFIG_UPDATED',
        entityType: 'PlatformIntegration',
        entityId: integration.id,
        metadata: { key, configuredFields },
      },
    });
    return this.list();
  }

  async test(key: string, actorId: string) {
    const db = this.prisma.forPlatform();
    const integration = await db.platformIntegration.findUnique({ where: { key } });
    if (!integration) throw new NotFoundException('اتصال سامانه یافت نشد.');
    try {
      let limitedMessage: string | null = null;
      if (key === 'PAYMENT_GATEWAY') {
        const config = await this.config.getPaymentGatewayConfig();
        if (!config) throw new BadRequestException('ابتدا اطلاعات زرین‌پال را ثبت کنید.');
        const baseUrl = config.sandbox
          ? 'https://sandbox.zarinpal.com'
          : 'https://payment.zarinpal.com';
        const response = await fetch(
          `${baseUrl}/pg/v4/payment/feeCalculation.json`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchant_id: config.merchantId,
              amount: 10_000,
              currency: 'IRR',
            }),
            signal: AbortSignal.timeout(15_000),
          },
        );
        const body = (await response.json().catch(() => null)) as
          | { data?: { code?: number } }
          | null;
        if (!response.ok || body?.data?.code !== 100) throw new Error('unhealthy');
      } else if (key === 'SMS') {
        const config = await this.config.getSmsGatewayConfig();
        if (!config) throw new BadRequestException('ابتدا اطلاعات کاوه‌نگار را ثبت کنید.');
        const response = await fetch(
          `https://api.kavenegar.com/v1/${encodeURIComponent(config.apiKey)}/account/info.json`,
          { signal: AbortSignal.timeout(15_000) },
        );
        const body = (await response.json().catch(() => null)) as
          | { return?: { status?: number; message?: string } }
          | null;
        if (body?.return?.status === 430) {
          limitedMessage =
            'کلید API معتبر است، اما حساب کاوه‌نگار هنوز احراز هویت نشده و فقط دسترسی آزمایشی دارد.';
        } else if (!response.ok || body?.return?.status !== 200) {
          throw new Error(
            body?.return?.message || `Kavenegar status ${body?.return?.status}`,
          );
        }
      } else {
        throw new BadRequestException('تست این اتصال هنوز پیاده‌سازی نشده است.');
      }

      const checkedAt = new Date();
      const status = limitedMessage ? 'CONFIGURED' : 'HEALTHY';
      await db.$transaction([
        db.platformIntegration.update({
          where: { key },
          data: { status, lastCheckedAt: checkedAt },
        }),
        db.auditLog.create({
          data: {
            actorId,
            action: limitedMessage
              ? 'PLATFORM_INTEGRATION_TEST_LIMITED'
              : 'PLATFORM_INTEGRATION_TEST_SUCCEEDED',
            entityType: 'PlatformIntegration',
            entityId: integration.id,
            metadata: { key, limited: Boolean(limitedMessage) },
          },
        }),
      ]);
      return {
        healthy: !limitedMessage,
        limited: Boolean(limitedMessage),
        message:
          limitedMessage ||
          'اتصال با موفقیت بررسی شد و سالم است.',
        checkedAt,
      };
    } catch (error) {
      await db.platformIntegration.update({
        where: { key },
        data: { status: 'DEGRADED', lastCheckedAt: new Date() },
      });
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'اتصال با اطلاعات ثبت‌شده برقرار نشد؛ کلید و وضعیت حساب را بررسی کنید.',
      );
    }
  }

  private mask(value: string) {
    if (value.length <= 8) return '••••••••';
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
  }
}
