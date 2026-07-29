import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import {
  AthletePaymentsPanel,
  Membership,
  Payment,
} from '../../../../components/ui/athlete-payments-panel';

async function getPaymentData() {
  const token = (await cookies()).get('accessToken')?.value;
  const [payments, memberships] = await Promise.all([
    api.get<Payment[]>('/athletes/me/payments', { accessToken: token }).catch(() => []),
    api.get<Membership[]>('/athletes/me/memberships', { accessToken: token }).catch(() => []),
  ]);
  return { payments, memberships };
}

export default async function AthletePaymentsPage() {
  const data = await getPaymentData();
  return <AthletePaymentsPanel initialPayments={data.payments} memberships={data.memberships} />;
}
