import { cookies } from 'next/headers';
import { api } from './api';
import { OwnerPayment, PaymentSummary } from '../components/ui/owner-finance-panel';

export async function getOwnerFinance() {
  const token = (await cookies()).get('accessToken')?.value;
  const [payments, summary] = await Promise.all([
    api.get<OwnerPayment[]>('/payments', { accessToken: token }).catch(() => []),
    api.get<PaymentSummary>('/payments/summary', { accessToken: token }).catch(() => ({ revenueThisMonth: 0, successfulPaymentsThisMonth: 0, pendingPayments: 0, activeMemberships: 0 })),
  ]);
  return { payments, summary };
}
