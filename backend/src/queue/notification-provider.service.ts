import { Injectable, Logger } from '@nestjs/common';

export interface SendSmsInput {
  to: string;
  text: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Thin provider abstraction. Swap the implementation of each method for a
 * real Iranian SMS gateway (e.g. Kavenegar, Melipayamak) or email provider
 * (e.g. an SMTP relay) — the processor and NotificationsService never need
 * to change, they only depend on this interface.
 */
@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);

  async sendSms(input: SendSmsInput): Promise<void> {
    if (!process.env.SMS_PROVIDER_API_KEY) {
      this.logger.warn(`[SMS dry-run] to=${input.to} text=${input.text}`);
      return;
    }
    // Example shape for a provider like Kavenegar:
    // await fetch(`https://api.kavenegar.com/v1/${apiKey}/sms/send.json`, {
    //   method: 'POST',
    //   body: new URLSearchParams({ receptor: input.to, message: input.text }),
    // });
    throw new Error('SMS provider not yet wired — implement sendSms() for your chosen gateway.');
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    if (!process.env.SMTP_HOST) {
      this.logger.warn(`[Email dry-run] to=${input.to} subject=${input.subject}`);
      return;
    }
    throw new Error('Email provider not yet wired — implement sendEmail() for your SMTP relay.');
  }
}
