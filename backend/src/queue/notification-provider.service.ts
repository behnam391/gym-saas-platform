import { Injectable, Logger } from '@nestjs/common';
import { PlatformIntegrationConfigService } from '../integrations/platform-integration-config.service';

export interface SendSmsInput {
  to: string;
  text: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);

  constructor(
    private readonly integrationConfig: PlatformIntegrationConfigService,
  ) {}

  async sendSms(input: SendSmsInput): Promise<void> {
    const config = await this.integrationConfig.getSmsGatewayConfig();
    const recipient = this.normalizeMobile(input.to);
    const apiKey = config?.apiKey;
    const allowedRecipients = config?.allowedRecipients ?? [];
    const dryRun = config?.dryRun ?? true;

    if (!apiKey || dryRun) {
      this.logger.warn(`[SMS dry-run] to=${this.maskMobile(recipient)}`);
      return;
    }
    if (
      !allowedRecipients.includes('*') &&
      !allowedRecipients.includes(recipient)
    ) {
      this.logger.warn(
        `[SMS blocked: recipient is not allowed] to=${this.maskMobile(recipient)}`,
      );
      return;
    }

    const body = new URLSearchParams({
      receptor: recipient,
      message: input.text,
    });
    const sender = config?.sender?.trim();
    if (sender) body.set('sender', sender);

    const response = await fetch(
      `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/sms/send.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(15_000),
      },
    );
    const result = (await response.json().catch(() => null)) as
      | { return?: { status?: number; message?: string } }
      | null;
    if (!response.ok || result?.return?.status !== 200) {
      throw new Error(
        `Kavenegar rejected SMS (${result?.return?.status ?? response.status}): ${result?.return?.message ?? 'unknown error'}`,
      );
    }
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    if (!process.env.SMTP_HOST) {
      this.logger.warn(`[Email dry-run] to=${input.to} subject=${input.subject}`);
      return;
    }
    throw new Error('Email provider is not configured yet.');
  }

  private normalizeMobile(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('0098')) return `0${digits.slice(4)}`;
    if (digits.startsWith('98')) return `0${digits.slice(2)}`;
    return digits;
  }

  private maskMobile(value: string) {
    if (value.length < 7) return '***';
    return `${value.slice(0, 4)}***${value.slice(-4)}`;
  }
}
