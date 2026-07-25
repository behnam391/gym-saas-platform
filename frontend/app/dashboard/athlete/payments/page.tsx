import { cookies } from 'next/headers';
import { CreditCard, ReceiptText } from 'lucide-react';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { Badge } from '../../../../components/ui/badge';

interface Payment {
  id: string;
  amount: number | string;
  status: string;
  method: string;
  paidAt?: string | null;
  createdAt: string;
  membership?: { plan?: { title: string } } | null;
}

async function getPayments() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<Payment[]>('/athletes/me/payments', { accessToken: token }); } catch { return []; }
}

const METHOD_LABELS: Record<string, string> = { CASH: 'نقدی', POS: 'کارت‌خوان', ONLINE_GATEWAY: 'آنلاین', WALLET: 'کیف پول' };

export default async function AthletePaymentsPage() {
  const payments = await getPayments();
  const total = payments.filter((item) => item.status === 'SUCCEEDED').reduce((sum, item) => sum + Number(item.amount), 0);
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">پرداخت‌ها و رسیدها</h1><p className="text-muted">سوابق مالی عضویت و خریدهای ثبت‌شده</p></header>
      <div className="grid gap-5 sm:grid-cols-2">
        <MembershipCard><p className="text-sm text-muted">مجموع پرداخت موفق</p><p className="mt-2 text-2xl font-extrabold">{total.toLocaleString('fa-IR')} تومان</p></MembershipCard>
        <MembershipCard><p className="text-sm text-muted">تعداد تراکنش‌ها</p><p className="mt-2 text-2xl font-extrabold">{payments.length.toLocaleString('fa-IR')}</p></MembershipCard>
      </div>
      <MembershipCard className="overflow-hidden p-0">
        {payments.length === 0 ? <div className="p-8 text-center text-muted"><ReceiptText className="mx-auto mb-3 size-9" />تراکنشی ثبت نشده است.</div> : (
          <div className="divide-y divide-white/10">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3"><span className="rounded-xl bg-accent/10 p-2 text-accent-soft"><CreditCard className="size-5" /></span><div><p className="font-bold">{payment.membership?.plan?.title ?? 'پرداخت باشگاه'}</p><p className="text-xs text-muted">{new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString('fa-IR-u-ca-persian')} · {METHOD_LABELS[payment.method] ?? payment.method}</p></div></div>
                <div className="text-left"><p className="font-extrabold">{Number(payment.amount).toLocaleString('fa-IR')} تومان</p><Badge tone={payment.status === 'SUCCEEDED' ? 'success' : 'warning'}>{payment.status === 'SUCCEEDED' ? 'پرداخت‌شده' : 'در انتظار'}</Badge></div>
              </div>
            ))}
          </div>
        )}
      </MembershipCard>
    </div>
  );
}
