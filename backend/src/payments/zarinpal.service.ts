import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import ZarinPal from 'zarinpal-node-sdk';

interface ZarinpalResponse<T> {
  data?: T;
}

export interface VerifiedPayment {
  code: number;
  referenceId: string;
  cardPan?: string;
}

@Injectable()
export class ZarinpalService {
  private readonly client: ZarinPal | null;

  constructor() {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
    this.client = merchantId
      ? new ZarinPal({
          merchantId,
          accessToken: '',
          sandbox: process.env.ZARINPAL_SANDBOX === 'true',
        })
      : null;
  }

  isConfigured() {
    return Boolean(this.client);
  }

  getRedirectUrl(authority: string) {
    return this.requireClient().payments.getRedirectUrl(authority);
  }

  async requestPayment(input: {
    amountToman: number;
    callbackUrl: string;
    description: string;
    mobile?: string;
  }) {
    const client = this.requireClient();
    const response = (await client.payments.create({
      // The official SDK sends IRR, while Gordyar stores prices in toman.
      amount: this.toRial(input.amountToman),
      callback_url: input.callbackUrl,
      description: input.description,
      mobile: input.mobile,
    })) as ZarinpalResponse<{ code: number; authority: string }>;
    const data = response.data;
    if (!data || data.code !== 100 || !data.authority) {
      throw new ServiceUnavailableException('درگاه زرین‌پال درخواست پرداخت را نپذیرفت.');
    }
    return {
      authority: data.authority,
      redirectUrl: client.payments.getRedirectUrl(data.authority),
    };
  }

  async verifyPayment(authority: string, amountToman: number): Promise<VerifiedPayment> {
    const client = this.requireClient();
    const response = (await client.verifications.verify({
      authority,
      amount: this.toRial(amountToman),
    })) as ZarinpalResponse<{
      code: number;
      ref_id: number | string;
      card_pan?: string;
    }>;
    const data = response.data;
    if (!data || ![100, 101].includes(data.code) || data.ref_id === undefined) {
      throw new ServiceUnavailableException('تأیید نهایی تراکنش زرین‌پال انجام نشد.');
    }
    return {
      code: data.code,
      referenceId: String(data.ref_id),
      cardPan: data.card_pan,
    };
  }

  private requireClient() {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'درگاه پرداخت هنوز توسط مدیر سامانه فعال نشده است.',
      );
    }
    return this.client;
  }

  private toRial(amountToman: number) {
    const rial = Math.round(amountToman * 10);
    if (!Number.isSafeInteger(rial) || rial < 1_000) {
      throw new ServiceUnavailableException('مبلغ پرداخت برای درگاه معتبر نیست.');
    }
    return rial;
  }
}
