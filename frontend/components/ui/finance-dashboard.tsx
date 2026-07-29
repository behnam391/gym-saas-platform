'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Coffee,
  CreditCard,
  FileSpreadsheet,
  Filter,
  Landmark,
  LoaderCircle,
  ReceiptText,
  Search,
  TrendingUp,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { MembershipCard } from './membership-card';

interface FinanceTransaction {
  id: string;
  amount: number | string;
  method: string;
  status: string;
  gatewayRef?: string | null;
  paidAt?: string | null;
  createdAt: string;
  membershipId?: string | null;
  orderId?: string | null;
  user: { id: string; firstName: string; lastName: string; mobile: string };
  membership?: { plan?: { title: string } } | null;
}

interface FinanceDashboardResponse {
  transactions: FinanceTransaction[];
  summary: {
    collected: number;
    membershipRevenue: number;
    cafeteriaRevenue: number;
    otherRevenue: number;
    refunded: number;
    pendingAmount: number;
    successfulCount: number;
    debtorsCount: number;
    outstandingMemberships: number;
    unpaidBuffetOrders: number;
    unpaidBuffetValue: number;
    expiringSoon: number;
  };
  methodBreakdown: Array<{ method: string; amount: number; count: number }>;
  monthlyTrend: Array<{ month: string; amount: number }>;
  debtors: Array<{
    membershipId: string;
    user: { id: string; firstName: string; lastName: string; mobile: string };
    planTitle: string;
    planPrice: number;
    paid: number;
    outstanding: number;
    requestedAt: string;
  }>;
  range: { from: string; to: string };
}

interface FinanceFilters {
  from: string;
  to: string;
  search: string;
  source: string;
  method: string;
  status: string;
}

const METHODS: Record<string, string> = {
  ONLINE_GATEWAY: 'درگاه آنلاین',
  CASH: 'نقدی',
  POS: 'کارت‌خوان',
  WALLET: 'کیف پول',
};

const STATUSES: Record<string, string> = {
  SUCCEEDED: 'موفق',
  PENDING: 'در انتظار',
  FAILED: 'ناموفق',
  REFUNDED: 'بازگشت وجه',
};

function inputDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function initialFilters(): FinanceFilters {
  const today = new Date();
  return {
    from: inputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: inputDate(today),
    search: '',
    source: '',
    method: '',
    status: '',
  };
}

function toIsoRange(filters: FinanceFilters) {
  const from = new Date(`${filters.from}T00:00:00`);
  const to = new Date(`${filters.to}T00:00:00`);
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

function money(value: number | string) {
  return `${Number(value).toLocaleString('fa-IR')} تومان`;
}

function transactionSource(transaction: FinanceTransaction) {
  if (transaction.membershipId) return 'عضویت';
  if (transaction.orderId) return 'بوفه';
  return 'سایر';
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function FinanceDashboard() {
  const initial = useMemo(() => initialFilters(), []);
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [data, setData] = useState<FinanceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams(toIsoRange(applied));
        if (applied.search.trim()) params.set('search', applied.search.trim());
        if (applied.source) params.set('source', applied.source);
        if (applied.method) params.set('method', applied.method);
        if (applied.status) params.set('status', applied.status);
        const response = await api.get<FinanceDashboardResponse>(
          `/payments/dashboard?${params.toString()}`,
        );
        if (active) setData(response);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof ApiError
              ? cause.message
              : 'دریافت اطلاعات مالی انجام نشد.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [applied]);

  function applyPreset(type: 'today' | 'month' | 'year') {
    const today = new Date();
    const from =
      type === 'today'
        ? today
        : type === 'year'
          ? new Date(today.getFullYear(), 0, 1)
          : new Date(today.getFullYear(), today.getMonth(), 1);
    const next = { ...draft, from: inputDate(from), to: inputDate(today) };
    setDraft(next);
    setApplied(next);
  }

  function exportTransactions() {
    if (!data?.transactions.length) return;
    const header = [
      'عضو',
      'موبایل',
      'منبع',
      'شرح',
      'روش پرداخت',
      'مبلغ',
      'تاریخ',
      'وضعیت',
      'شماره پیگیری',
    ];
    const rows = data.transactions.map((item) => [
      `${item.user.firstName} ${item.user.lastName}`,
      item.user.mobile,
      transactionSource(item),
      item.membership?.plan?.title ?? (item.orderId ? 'خرید بوفه' : 'سایر'),
      METHODS[item.method] ?? item.method,
      Number(item.amount),
      new Date(item.paidAt ?? item.createdAt).toLocaleString('fa-IR'),
      STATUSES[item.status] ?? item.status,
      item.gatewayRef ?? '',
    ]);
    const csv = `\uFEFF${[header, ...rows]
      .map((row) => row.map((cell) => csvCell(cell)).join(','))
      .join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gordyar-finance-${applied.from}-${applied.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const summary = data?.summary;
  const maxTrend = Math.max(1, ...(data?.monthlyTrend.map((item) => item.amount) ?? [1]));
  const sourceTotal =
    (summary?.membershipRevenue ?? 0) +
    (summary?.cafeteriaRevenue ?? 0) +
    (summary?.otherRevenue ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <MembershipCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold">
              <Filter className="size-5 text-accent-soft" />
              فیلتر گزارش مالی
            </h2>
            <p className="mt-1 text-sm text-muted">بازه، عضو، منبع درآمد، روش و وضعیت پرداخت</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => applyPreset('today')}>امروز</Button>
            <Button size="sm" variant="secondary" onClick={() => applyPreset('month')}>این ماه</Button>
            <Button size="sm" variant="secondary" onClick={() => applyPreset('year')}>امسال</Button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">از تاریخ</span>
            <input type="date" value={draft.from} max={draft.to} onChange={(event) => setDraft({ ...draft, from: event.target.value })} className="h-11 rounded-xl border border-white/10 bg-base/40 px-3" />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">تا تاریخ</span>
            <input type="date" value={draft.to} min={draft.from} max={inputDate(new Date())} onChange={(event) => setDraft({ ...draft, to: event.target.value })} className="h-11 rounded-xl border border-white/10 bg-base/40 px-3" />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">عضو یا موبایل</span>
            <span className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder="جست‌وجو" className="h-11 w-full rounded-xl border border-white/10 bg-base/40 pr-9 pl-3 outline-none focus:border-accent/60" />
            </span>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">منبع</span>
            <select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} className="h-11 rounded-xl border border-white/10 bg-base/40 px-3">
              <option value="">همه منابع</option>
              <option value="MEMBERSHIP">عضویت</option>
              <option value="CAFETERIA">بوفه</option>
              <option value="OTHER">سایر</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">روش</span>
            <select value={draft.method} onChange={(event) => setDraft({ ...draft, method: event.target.value })} className="h-11 rounded-xl border border-white/10 bg-base/40 px-3">
              <option value="">همه روش‌ها</option>
              {Object.entries(METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">وضعیت</span>
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className="h-11 rounded-xl border border-white/10 bg-base/40 px-3">
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-danger">{error}</p> : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportTransactions} disabled={loading || !data?.transactions.length}>
              <FileSpreadsheet className="size-4 text-success" />
              خروجی Excel
            </Button>
            <Button onClick={() => setApplied({ ...draft })} disabled={loading || !draft.from || !draft.to}>
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Filter className="size-4" />}
              اعمال فیلتر
            </Button>
          </div>
        </div>
      </MembershipCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MembershipCard className="p-5"><Landmark className="size-7 text-success" /><p className="mt-4 text-sm text-muted">دریافتی موفق</p><p className="mt-1 text-xl font-extrabold">{money(summary?.collected ?? 0)}</p></MembershipCard>
        <MembershipCard className="p-5"><UserRoundX className="size-7 text-danger" /><p className="mt-4 text-sm text-muted">مطالبات عضویت</p><p className="mt-1 text-xl font-extrabold">{money(summary?.outstandingMemberships ?? 0)}</p></MembershipCard>
        <MembershipCard className="p-5"><UsersRound className="size-7 text-accent-soft" /><p className="mt-4 text-sm text-muted">درآمد عضویت</p><p className="mt-1 text-xl font-extrabold">{money(summary?.membershipRevenue ?? 0)}</p></MembershipCard>
        <MembershipCard className="p-5"><Coffee className="size-7 text-warning" /><p className="mt-4 text-sm text-muted">دریافتی بوفه</p><p className="mt-1 text-xl font-extrabold">{money(summary?.cafeteriaRevenue ?? 0)}</p></MembershipCard>
        <MembershipCard className="p-5"><ReceiptText className="size-7 text-muted" /><p className="mt-4 text-sm text-muted">پرداخت در انتظار</p><p className="mt-1 text-xl font-extrabold">{money(summary?.pendingAmount ?? 0)}</p></MembershipCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <MembershipCard>
          <h2 className="flex items-center gap-2 font-bold"><TrendingUp className="size-5 text-accent-soft" />روند شش‌ماهه دریافتی</h2>
          <div className="mt-6 grid grid-cols-6 items-end gap-3">
            {data?.monthlyTrend.map((item) => (
              <div key={item.month} className="grid gap-2 text-center">
                <p className="text-[10px] text-muted">{Number(item.amount).toLocaleString('fa-IR')}</p>
                <div className="mx-auto flex h-36 w-full max-w-12 items-end overflow-hidden rounded-t-xl bg-base/40">
                  <div className="w-full rounded-t-xl bg-gradient-to-t from-accent to-accent-soft transition-all" style={{ height: `${Math.max(4, (item.amount / maxTrend) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted">{item.month}</p>
              </div>
            ))}
          </div>
        </MembershipCard>

        <MembershipCard>
          <h2 className="font-bold">ترکیب درآمد و تعهدها</h2>
          <div className="mt-5 grid gap-4">
            {[
              ['عضویت', summary?.membershipRevenue ?? 0, 'bg-accent'],
              ['بوفه', summary?.cafeteriaRevenue ?? 0, 'bg-warning'],
              ['سایر', summary?.otherRevenue ?? 0, 'bg-muted'],
            ].map(([label, value, color]) => (
              <div key={String(label)}>
                <div className="mb-1.5 flex justify-between text-sm"><span>{label}</span><span className="text-muted">{money(Number(value))}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-base/50"><div className={`h-full rounded-full ${color}`} style={{ width: `${sourceTotal ? (Number(value) / sourceTotal) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4 text-sm">
            <p className="flex items-center justify-between"><span>سفارش بوفه تحویل‌شده بدون پرداخت</span><strong>{(summary?.unpaidBuffetOrders ?? 0).toLocaleString('fa-IR')} مورد</strong></p>
            <p className="flex items-center justify-between"><span>ارزش بوفه وصول‌نشده</span><strong>{money(summary?.unpaidBuffetValue ?? 0)}</strong></p>
            <p className="flex items-center justify-between"><span>عضویت رو به اتمام تا ۷ روز</span><strong>{(summary?.expiringSoon ?? 0).toLocaleString('fa-IR')} عضو</strong></p>
          </div>
        </MembershipCard>
      </div>

      <MembershipCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div><h2 className="font-bold">اعضای بدهکار</h2><p className="mt-1 text-xs text-muted">عضویت‌های منتظر پرداخت</p></div>
          <Badge tone={data?.debtors.length ? 'danger' : 'success'}>{(data?.debtors.length ?? 0).toLocaleString('fa-IR')} نفر</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-surface-raised text-muted"><tr><th className="px-5 py-3 font-medium">عضو</th><th className="px-5 py-3 font-medium">پلن</th><th className="px-5 py-3 font-medium">مبلغ پلن</th><th className="px-5 py-3 font-medium">پرداخت‌شده</th><th className="px-5 py-3 font-medium">مانده</th><th className="px-5 py-3 font-medium">تاریخ درخواست</th></tr></thead>
            <tbody>
              {data?.debtors.map((item) => <tr key={item.membershipId} className="border-t border-white/10"><td className="px-5 py-4"><p className="font-bold">{item.user.firstName} {item.user.lastName}</p><p className="text-xs text-muted">{item.user.mobile}</p></td><td className="px-5 py-4">{item.planTitle}</td><td className="px-5 py-4 text-muted">{money(item.planPrice)}</td><td className="px-5 py-4 text-success">{money(item.paid)}</td><td className="px-5 py-4 font-bold text-danger">{money(item.outstanding)}</td><td className="px-5 py-4 text-muted">{new Date(item.requestedAt).toLocaleDateString('fa-IR')}</td></tr>)}
              {!loading && !data?.debtors.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">عضو بدهکاری وجود ندارد.</td></tr>}
            </tbody>
          </table>
        </div>
      </MembershipCard>

      <MembershipCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <div><h2 className="font-bold">تراکنش‌های مالی</h2><p className="mt-1 text-xs text-muted">{(data?.transactions.length ?? 0).toLocaleString('fa-IR')} تراکنش در بازه انتخابی</p></div>
          <p className="flex items-center gap-2 text-xs text-muted"><AlertTriangle className="size-4 text-warning" />تسویه مربی پس از ثبت نوع قرارداد و درصد سهم فعال می‌شود.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-surface-raised text-muted"><tr><th className="px-5 py-3 font-medium">عضو</th><th className="px-5 py-3 font-medium">منبع</th><th className="px-5 py-3 font-medium">شرح</th><th className="px-5 py-3 font-medium">روش</th><th className="px-5 py-3 font-medium">مبلغ</th><th className="px-5 py-3 font-medium">تاریخ</th><th className="px-5 py-3 font-medium">وضعیت</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-5 py-14 text-center text-muted"><LoaderCircle className="mx-auto mb-2 size-6 animate-spin" />در حال دریافت اطلاعات مالی…</td></tr>}
              {!loading && data?.transactions.map((item) => <tr key={item.id} className="border-t border-white/10"><td className="px-5 py-4"><p className="font-bold">{item.user.firstName} {item.user.lastName}</p><p className="text-xs text-muted">{item.user.mobile}</p></td><td className="px-5 py-4"><Badge tone={item.membershipId ? 'accent' : item.orderId ? 'warning' : 'muted'}>{transactionSource(item)}</Badge></td><td className="px-5 py-4 text-muted">{item.membership?.plan?.title ?? (item.orderId ? 'خرید بوفه' : 'سایر')}</td><td className="px-5 py-4">{METHODS[item.method] ?? item.method}</td><td className="px-5 py-4 font-bold">{money(item.amount)}</td><td className="px-5 py-4 text-muted">{new Date(item.paidAt ?? item.createdAt).toLocaleDateString('fa-IR')}</td><td className="px-5 py-4"><Badge tone={item.status === 'SUCCEEDED' ? 'success' : item.status === 'FAILED' ? 'danger' : item.status === 'REFUNDED' ? 'muted' : 'warning'}>{STATUSES[item.status] ?? item.status}</Badge></td></tr>)}
              {!loading && !data?.transactions.length && <tr><td colSpan={7} className="px-5 py-14 text-center text-muted"><CreditCard className="mx-auto mb-3 size-9" />در این بازه تراکنشی ثبت نشده است.</td></tr>}
            </tbody>
          </table>
        </div>
      </MembershipCard>
    </div>
  );
}
