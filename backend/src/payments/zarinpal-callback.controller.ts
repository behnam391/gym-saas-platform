import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments/zarinpal')
export class ZarinpalCallbackController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('callback')
  async callback(
    @Query('Authority') authority: string | undefined,
    @Query('Status') status: string | undefined,
    @Res() response: Response,
  ) {
    const result = await this.payments.completeZarinpalPayment({ authority, status });
    return response.redirect(303, result.redirectUrl);
  }
}
