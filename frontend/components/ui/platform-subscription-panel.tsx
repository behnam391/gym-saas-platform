'use client';

import { useState } from 'react';
import { Check, Crown, ReceiptText, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { MembershipCard } from './membership-card';

interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  monthlyPrice: number | string;
  features: string[];
}

interface TenantSubscription {
  id: string;
  status: string;
  startsAt: string;
  renewsAt?: string | null;
  plan: SubscriptionPlan;
}

interface SubscriptionPayment {
  id: string;
  amount: number | string;
  status: string;
  method: string;
  subscriptionMonths?: number | null;
  gatewayRef?: string | null;
  gatewayCardPan?: string | null;
  paidAt?: string | null;
  createdAt: string;
  subscriptionPlan?: SubscriptionPlan | null;
}

export interface PlatformSubscriptionData {
  plans: SubscriptionPlan[];
  subscription?: TenantSubscription | null;
  payments: SubscriptionPayment[];
  access: {
    status: string;
    planCode?: string | null;
    planName?: string | null;
    renewsAt?: string | null;
    isOperational: boolean;
    features: string[];
    limits: { staff: number; members: number; devices: number };
  };
}

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'آزمایشی',
  ACTIVE: 'فعال',
  PAST_DUE: 'سررسید گذشته',
  SUSPENDED: 'تعلیق‌شده',
  CANCELLED: 'لغوشده',
};

export function PlatformSubscriptionPanel({
  initial,
}: {
  initial: PlatformSubscriptionData;
}) {
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = initial.subscription;

  async function pay(planCode: string) {
    setLoadingPlan(planCode);
    setError(null);
    try {
      const result = await api.post<{ redirectUrl: string }>(
        '/payments/platform-subscription/zarinpal',
        { planCode, months },
      );
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'اتصال به درگاه پرداخت انجام نشد؛ دوباره تلاش کنید.',
      );
      setLoadingPlan(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">اشتراک گُردیار باشگاه</h1>
        <p className="text-muted">
          انتخاب پلن، تمدید امن با زرین‌پال و مشاهده رسیدهای اشتراک
        </p>
      </header>

      {!initial.access.isOperational && (
        <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm leading-7 text-danger">
          اشتراک باشگاه فعال نیست. اطلاعات و سوابق قبلی حفظ شده‌اند، اما ایجاد
          تبلیغ، اتصال دستگاه جدید و ثبت قرارداد مالی تا زمان تمدید محدود است.
        </div>
      )}

      <MembershipCard className="border-accent/25 bg-accent/5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent-soft">
            <Crown className="size-6" />
          </span>
          <div className="min-w-52 flex-1">
            <p className="text-sm text-muted">وضعیت فعلی</p>
            <h2 className="mt-1 text-xl font-extrabold">
              {current?.plan.name ?? 'بدون اشتراک فعال'}
            </h2>
            {current?.renewsAt && (
              <p className="mt-1 text-xs text-muted">
                اعتبار تا{' '}
                {new Date(current.renewsAt).toLocaleDateString(
                  'fa-IR-u-ca-persian',
                )}
              </p>
            )}
          </div>
          {current && (
            <Badge tone={current.status === 'ACTIVE' ? 'success' : 'warning'}>
              {STATUS_LABELS[current.status] ?? current.status}
            </Badge>
          )}
        </div>
        <div className="mt-5 grid gap-3 border-t border-border/10 pt-5 text-sm sm:grid-cols-3">
          <div>
            <span className="text-muted">ظرفیت اعضا</span>
            <strong className="mt-1 block">
              {initial.access.limits.members.toLocaleString('fa-IR')} نفر
            </strong>
          </div>
          <div>
            <span className="text-muted">ظرفیت پرسنل</span>
            <strong className="mt-1 block">
              {initial.access.limits.staff.toLocaleString('fa-IR')} حساب
            </strong>
          </div>
          <div>
            <span className="text-muted">دستگاه تردد</span>
            <strong className="mt-1 block">
              {initial.access.limits.devices > 0
                ? `${initial.access.limits.devices.toLocaleString('fa-IR')} دستگاه`
                : 'در این پلن فعال نیست'}
            </strong>
          </div>
        </div>
      </MembershipCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold">انتخاب پلن و دوره پرداخت</h2>
          <p className="mt-1 text-sm text-muted">
            مبلغ فقط از قیمت ثبت‌شده سامانه محاسبه می‌شود.
          </p>
        </div>
        <select
          aria-label="دوره اشتراک"
          value={months}
          onChange={(event) =>
            setMonths(Number(event.target.value) as 1 | 3 | 6 | 12)
          }
          className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-sm"
        >
          <option value={1}>یک‌ماهه</option>
          <option value={3}>سه‌ماهه</option>
          <option value={6}>شش‌ماهه</option>
          <option value={12}>یک‌ساله</option>
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {initial.plans.map((plan) => {
          const total = Number(plan.monthlyPrice) * months;
          return (
            <MembershipCard
              key={plan.id}
              className={
                current?.plan.code === plan.code ? 'border-accent/40' : ''
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold">{plan.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {plan.description}
                  </p>
                </div>
                {current?.plan.code === plan.code && (
                  <Badge tone="success">پلن فعلی</Badge>
                )}
              </div>
              <p className="mt-5 text-2xl font-extrabold text-accent-soft">
                {total.toLocaleString('fa-IR')}{' '}
                <span className="text-xs text-muted">تومان</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {Number(plan.monthlyPrice).toLocaleString('fa-IR')} تومان در ماه
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                onClick={() => pay(plan.code)}
                disabled={loadingPlan !== null}
              >
                <ShieldCheck className="size-4" />
                {loadingPlan === plan.code
                  ? 'در حال اتصال…'
                  : current?.plan.code === plan.code
                    ? 'تمدید با زرین‌پال'
                    : 'خرید این پلن'}
              </Button>
            </MembershipCard>
          );
        })}
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <MembershipCard className="overflow-hidden p-0">
        <div className="border-b border-border/10 p-5">
          <h2 className="font-extrabold">سوابق پرداخت اشتراک</h2>
        </div>
        {initial.payments.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <ReceiptText className="mx-auto mb-3 size-9" />
            هنوز پرداخت اشتراکی ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {initial.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-bold">
                    {payment.subscriptionPlan?.name ?? 'اشتراک گُردیار'}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {payment.subscriptionMonths
                      ? `${payment.subscriptionMonths.toLocaleString('fa-IR')} ماه · `
                      : ''}
                    {new Date(
                      payment.paidAt ?? payment.createdAt,
                    ).toLocaleDateString('fa-IR-u-ca-persian')}
                    {payment.gatewayRef
                      ? ` · پیگیری ${payment.gatewayRef}`
                      : ''}
                  </p>
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
                    {payment.status === 'SUCCEEDED'
                      ? 'پرداخت‌شده'
                      : payment.status === 'FAILED'
                        ? 'ناموفق'
                        : 'در انتظار'}
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
