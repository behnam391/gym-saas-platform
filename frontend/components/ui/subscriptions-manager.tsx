'use client';

import { useState } from 'react';
import { CircleDollarSign, Clock3, CreditCard, Landmark } from 'lucide-react';
import { api } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';
import { Button } from './button';
import { StatCard } from './stat-card';

interface Plan {
  id: string;
  code: string;
  name: string;
  monthlyPrice: number;
  features: string[];
}

interface Subscription {
  id: string;
  tenantId: string;
  status: string;
  renewsAt?: string | null;
  plan: Plan;
  tenant: { id: string; name: string; city: string };
}

interface SubscriptionSummary {
  revenueThisMonth: number;
  successfulPaymentsThisMonth: number;
  pendingPayments: number;
  activeSubscriptions: number;
}

interface SubscriptionPayment {
  id: string;
  amount: number | string;
  status: string;
  subscriptionMonths?: number | null;
  gatewayRef?: string | null;
  paidAt?: string | null;
  createdAt: string;
  tenant: { id: string; name: string };
  subscriptionPlan?: { id: string; code: string; name: string } | null;
}

export function SubscriptionsManager({
  plans,
  initial,
  summary,
  recentPayments,
}: {
  plans: Plan[];
  initial: Subscription[];
  summary: SubscriptionSummary;
  recentPayments: SubscriptionPayment[];
}) {
  const [items, setItems] = useState(initial);
  const [selection, setSelection] = useState<Record<string, string>>({});

  async function save(item: Subscription) {
    const changed = await api.patch<Subscription>(
      `/super-admin/subscriptions/${item.tenantId}`,
      {
        planCode: selection[item.tenantId] ?? item.plan.code,
        status: item.status === 'SUSPENDED' ? 'ACTIVE' : item.status,
      },
    );
    setItems((current) =>
      current.map((value) => (value.id === item.id ? changed : value)),
    );
  }

  async function toggle(item: Subscription) {
    const changed = await api.patch<Subscription>(
      `/super-admin/subscriptions/${item.tenantId}`,
      {
        planCode: selection[item.tenantId] ?? item.plan.code,
        status: item.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
      },
    );
    setItems((current) =>
      current.map((value) => (value.id === item.id ? changed : value)),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="درآمد اشتراک این ماه"
          value={`${Number(summary.revenueThisMonth).toLocaleString('fa-IR')} تومان`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="پرداخت موفق این ماه"
          value={summary.successfulPaymentsThisMonth}
          icon={CreditCard}
        />
        <StatCard
          label="اشتراک فعال"
          value={summary.activeSubscriptions}
          icon={Landmark}
        />
        <StatCard
          label="پرداخت در انتظار"
          value={summary.pendingPayments}
          icon={Clock3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <MembershipCard key={plan.id}>
            <p className="text-lg font-extrabold">{plan.name}</p>
            <p className="mt-2 text-2xl font-extrabold text-accent-soft">
              {Number(plan.monthlyPrice).toLocaleString('fa-IR')}{' '}
              <span className="text-xs text-muted">تومان / ماه</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </MembershipCard>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <MembershipCard
            key={item.id}
            className="flex flex-wrap items-center gap-4"
          >
            <div className="min-w-48 flex-1">
              <p className="font-extrabold">{item.tenant.name}</p>
              <p className="mt-1 text-xs text-muted">
                {item.tenant.city}
                {item.renewsAt
                  ? ` · تمدید ${new Date(item.renewsAt).toLocaleDateString('fa-IR-u-ca-persian')}`
                  : ''}
              </p>
            </div>
            <Badge tone={item.status === 'ACTIVE' ? 'success' : 'warning'}>
              {item.status === 'ACTIVE'
                ? 'فعال'
                : item.status === 'SUSPENDED'
                  ? 'تعلیق'
                  : item.status}
            </Badge>
            <select
              className="h-10 rounded-xl border border-border/10 bg-surface px-3 text-sm"
              value={selection[item.tenantId] ?? item.plan.code}
              onChange={(event) =>
                setSelection({
                  ...selection,
                  [item.tenantId]: event.target.value,
                })
              }
            >
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant="secondary" onClick={() => save(item)}>
              ذخیره پلن
            </Button>
            <Button size="sm" variant="ghost" onClick={() => toggle(item)}>
              {item.status === 'SUSPENDED' ? 'فعال‌سازی' : 'تعلیق'}
            </Button>
          </MembershipCard>
        ))}
      </div>

      <MembershipCard className="overflow-hidden p-0">
        <div className="border-b border-border/10 p-5">
          <h2 className="font-extrabold">آخرین پرداخت‌های اشتراک</h2>
        </div>
        {recentPayments.length === 0 ? (
          <p className="p-8 text-center text-muted">
            هنوز پرداخت اشتراکی ثبت نشده است.
          </p>
        ) : (
          <div className="divide-y divide-border/10">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-bold">{payment.tenant.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {payment.subscriptionPlan?.name ?? 'پلن اشتراک'}
                    {payment.subscriptionMonths
                      ? ` · ${payment.subscriptionMonths.toLocaleString('fa-IR')} ماه`
                      : ''}
                    {' · '}
                    {new Date(
                      payment.paidAt ?? payment.createdAt,
                    ).toLocaleDateString('fa-IR-u-ca-persian')}
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
