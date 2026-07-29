import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { KavenegarApi } from 'kavenegar';
import { PlatformIntegrationConfigService } from '../integrations/platform-integration-config.service';

export interface SendSmsInput {
  to: string;
  text: string;
  verification?: {
    token: string;
  };
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export type DeliveryResult = 'SENT' | 'DRY_RUN' | 'BLOCKED';

@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);

  constructor(
    private readonly integrationConfig: PlatformIntegrationConfigService,
  ) {}

  async sendSms(input: SendSmsInput): Promise<DeliveryResult> {
    const config = await this.integrationConfig.getSmsGatewayConfig();
    const recipient = this.normalizeMobile(input.to);
    const apiKey = config?.apiKey;
    const allowedRecipients = config?.allowedRecipients ?? [];
    const dryRun = config?.dryRun ?? true;

    if (!apiKey || dryRun) {
      this.logger.warn(`[SMS dry-run] to=${this.maskMobile(recipient)}`);
      return 'DRY_RUN';
    }
    if (
      !allowedRecipients.includes('*') &&
      !allowedRecipients.includes(recipient)
    ) {
      this.logger.warn(
        `[SMS blocked: recipient is not allowed] to=${this.maskMobile(recipient)}`,
      );
      return 'BLOCKED';
    }

    const api = KavenegarApi({ apikey: apiKey });
    await this.callKavenegar((done) => {
      if (input.verification && config?.otpTemplate?.trim()) {
        api.VerifyLookup(
          {
            receptor: recipient,
            token: input.verification.token,
            template: config.otpTemplate.trim(),
          },
          done,
        );
        return;
      }
      api.Send(
        {
          receptor: recipient,
          message: input.text,
          ...(config?.sender?.trim() ? { sender: config.sender.trim() } : {}),
        },
        done,
      );
    });
    return 'SENT';
  }

  async sendEmail(input: SendEmailInput): Promise<DeliveryResult> {
    if (!process.env.SMTP_HOST) {
      this.logger.warn(`[Email dry-run] to=${input.to} subject=${input.subject}`);
      return 'DRY_RUN';
    }
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'Gordyar <no-reply@gordyar.ir>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return 'SENT';
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

  private callKavenegar(
    invoke: (
      callback: (response: unknown, status?: number, message?: string) => void,
    ) => void,
  ) {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        settled = true;
        reject(new Error('Kavenegar request timed out.'));
      }, 15_000);
      invoke((_response, status, message) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (status === 200) {
          resolve();
          return;
        }
        reject(
          new Error(
            `Kavenegar rejected SMS (${status ?? 'network'}): ${message ?? 'unknown error'}`,
          ),
        );
      });
    });
  }
}
