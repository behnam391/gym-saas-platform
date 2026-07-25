import { CheckCircle2, Clock3, CreditCard, Landmark, UsersRound } from 'lucide-react';
import { Badge } from './badge';
import { MembershipCard } from './membership-card';
import { StatCard } from './stat-card';

export interface OwnerPayment {
  id: string;
  amount: number | string;
  method: string;
  status: string;
  gatewayRef?: string | null;
  paidAt?: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; mobile: string };
  membership?: { plan?: { title: string } } | null;
}

export interface PaymentSummary {
  revenueThisMonth: number;
  successfulPaymentsThisMonth: number;
  pendingPayments: number;
  activeMemberships: number;
}

const METHOD: Record<string, string> = { ONLINE_GATEWAY: 'درگاه آنلاین', CASH: 'نقدی', POS: 'کارت‌خوان', WALLET: 'کیف پول' };
const STATUS: Record<string, string> = { SUCCEEDED: 'موفق', PENDING: 'در انتظار', FAILED: 'ناموفق', REFUNDED: 'بازگشت وجه' };

export function OwnerFinancePanel({ payments, summary }: { payments: OwnerPayment[]; summary: PaymentSummary }) {
  const total = payments.filter((item) => item.status === 'SUCCEEDED').reduce((sum, item) => sum + Number(item.amount), 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="درآمد این ماه" value={`${summary.revenueThisMonth.toLocaleString('fa-IR')} تومان`} icon={Landmark} />
        <StatCard label="پرداخت موفق این ماه" value={summary.successfulPaymentsThisMonth} icon={CheckCircle2} />
        <StatCard label="پرداخت در انتظار" value={summary.pendingPayments} icon={Clock3} />
        <StatCard label="عضویت فعال" value={summary.activeMemberships} icon={UsersRound} />
      </div>
      <MembershipCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5"><div><h2 className="font-bold">تراکنش‌های باشگاه</h2><p className="text-xs text-muted">{payments.length.toLocaleString('fa-IR')} تراکنش ثبت‌شده</p></div><p className="text-sm text-muted">مجموع موفق: <strong className="text-ink">{total.toLocaleString('fa-IR')} تومان</strong></p></div>
        {!payments.length ? <div className="p-10 text-center text-muted"><CreditCard className="mx-auto mb-3 size-9" />هنوز تراکنشی ثبت نشده است.</div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-sm"><thead className="bg-surface-raised text-muted"><tr><th className="px-5 py-3 font-medium">عضو</th><th className="px-5 py-3 font-medium">پلن</th><th className="px-5 py-3 font-medium">روش</th><th className="px-5 py-3 font-medium">مبلغ</th><th className="px-5 py-3 font-medium">تاریخ</th><th className="px-5 py-3 font-medium">وضعیت</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-t border-white/10"><td className="px-5 py-4"><p className="font-bold">{payment.user.firstName} {payment.user.lastName}</p><p className="text-xs text-muted">{payment.user.mobile}</p></td><td className="px-5 py-4">{payment.membership?.plan?.title ?? 'خرید بوفه'}</td><td className="px-5 py-4 text-muted">{METHOD[payment.method] ?? payment.method}</td><td className="px-5 py-4 font-bold">{Number(payment.amount).toLocaleString('fa-IR')} تومان</td><td className="px-5 py-4 text-muted">{new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString('fa-IR-u-ca-persian')}</td><td className="px-5 py-4"><Badge tone={payment.status === 'SUCCEEDED' ? 'success' : payment.status === 'FAILED' ? 'danger' : 'warning'}>{STATUS[payment.status] ?? payment.status}</Badge></td></tr>)}</tbody></table></div>
        )}
      </MembershipCard>
    </div>
  );
}
