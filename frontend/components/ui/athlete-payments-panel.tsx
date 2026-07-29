'use client';

import { useState } from 'react';
import { CreditCard, ReceiptText, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { MembershipCard } from './membership-card';

export interface Payment {
  id: string;
  amount: number | string;
  status: string;
  method: string;
  gatewayRef?: string | null;
  gatewayCardPan?: string | null;
  paidAt?: string | null;
  createdAt: string;
  membership?: { plan?: { title: string } } | null;
}

export interface Membership {
  id: string;
  status: string;
  plan: { title: string; price: number | string };
  tenant: { name: string };
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'نقدی',
  POS: 'کارت‌خوان',
  ONLINE_GATEWAY: 'زرین‌پال',
  WALLET: 'کیف پول',
};

const STATUS_LABELS: Record<string, string> = {
  SUCCEEDED: 'پرداخت‌شده',
  PENDING: 'در انتظار',
  FAILED: 'ناموفق',
  REFUNDED: 'برگشت‌خورده',
};

export function AthletePaymentsPanel({
  initialPayments,
  memberships,
}: {
  initialPayments: Payment[];
  memberships: Membership[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payableMemberships = memberships.filter(
    (membership) => membership.status === 'PENDING_PAYMENT',
  );
  const total = initialPayments
    .filter((item) => item.status === 'SUCCEEDED')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  async function pay(membershipId: string) {
    setLoadingId(membershipId);
    setError(null);
    try {
      const result = await api.post<{ redirectUrl: string }>(
        `/payments/memberships/${membershipId}/zarinpal`,
      );
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'اتصال به درگاه پرداخت انجام نشد. دوباره تلاش کنید.',
      );
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">پرداخت‌ها و رسیدها</h1>
        <p className="text-muted">پرداخت امن عضویت و مشاهده سوابق مالی ثبت‌شده</p>
      </header>

      {payableMemberships.length > 0 && (
        <MembershipCard className="border-accent/30 bg-accent/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-accent/15 p-2 text-accent-soft">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h2 className="font-extrabold">عضویت آماده پرداخت</h2>
              <p className="text-sm text-muted">انتقال امن به درگاه رسمی زرین‌پال</p>
            </div>
          </div>
          <div className="grid gap-3">
            {payableMemberships.map((membership) => (
              <div
                key={membership.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/10 bg-surface/70 p-4"
              >
                <div>
                  <p className="font-bold">{membership.plan.title}</p>
                  <p className="mt-1 text-sm text-muted">{membership.tenant.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <strong>{Number(membership.plan.price).toLocaleString('fa-IR')} تومان</strong>
                  <Button
                    onClick={() => pay(membership.id)}
                    disabled={loadingId === membership.id}
                  >
                    {loadingId === membership.id ? 'در حال اتصال…' : 'پرداخت با زرین‌پال'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        </MembershipCard>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <MembershipCard>
          <p className="text-sm text-muted">مجموع پرداخت موفق</p>
          <p className="mt-2 text-2xl font-extrabold">
            {total.toLocaleString('fa-IR')} تومان
          </p>
        </MembershipCard>
        <MembershipCard>
          <p className="text-sm text-muted">تعداد تراکنش‌ها</p>
          <p className="mt-2 text-2xl font-extrabold">
            {initialPayments.length.toLocaleString('fa-IR')}
          </p>
        </MembershipCard>
      </div>

      <MembershipCard className="overflow-hidden p-0">
        {initialPayments.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <ReceiptText className="mx-auto mb-3 size-9" />
            تراکنشی ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {initialPayments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-accent/10 p-2 text-accent-soft">
                    <CreditCard className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">
                      {payment.membership?.plan?.title ?? 'پرداخت باشگاه'}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString(
                        'fa-IR-u-ca-persian',
                      )}{' '}
                      · {METHOD_LABELS[payment.method] ?? payment.method}
                    </p>
                    {payment.gatewayRef && (
                      <p className="mt-1 text-xs text-muted">
                        کد پیگیری: <span dir="ltr">{payment.gatewayRef}</span>
                        {payment.gatewayCardPan ? ` · کارت ${payment.gatewayCardPan}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-extrabold">
                    {Number(payment.amount).toLocaleString('fa-IR')} تومان
                  </p>
                  <Badge
                    tone={
                      payment.status === 'SUCCEEDED'
                        ? 'success'
                        : payment.status === 'FAILED'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {STATUS_LABELS[payment.status] ?? payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </MembershipCard>
    </div>
  );
}
