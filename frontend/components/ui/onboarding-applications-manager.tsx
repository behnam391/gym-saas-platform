'use client';

import { useMemo, useState } from 'react';
import { Building2, Search, Stethoscope } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface OnboardingApplication {
  id: string;
  type: 'GYM_OWNER' | 'TRAINER' | 'NUTRITIONIST';
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  firstName: string;
  lastName: string;
  nationalId: string;
  mobile: string;
  email?: string | null;
  province?: string | null;
  city: string;
  address?: string | null;
  gymName?: string | null;
  specialty?: string | null;
  licenseNumber?: string | null;
  notes?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

const TYPE_LABEL = { GYM_OWNER: 'صاحب باشگاه', TRAINER: 'مربی', NUTRITIONIST: 'متخصص تغذیه' };
const STATUS_LABEL = { PENDING: 'جدید', UNDER_REVIEW: 'در حال بررسی', APPROVED: 'تأییدشده', REJECTED: 'ردشده' };

export function OnboardingApplicationsManager({ initial }: { initial: OnboardingApplication[] }) {
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const value = search.trim().toLocaleLowerCase('fa-IR');
    return items.filter((item) => {
      const matchesStatus = status === 'ALL' || item.status === status;
      const matchesSearch = !value || [
        `${item.firstName} ${item.lastName}`, item.mobile, item.gymName,
        item.specialty, item.city,
      ].filter(Boolean).some((part) => String(part).toLocaleLowerCase('fa-IR').includes(value));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, status]);

  async function review(item: OnboardingApplication, nextStatus: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED') {
    setBusyId(item.id); setError(null);
    try {
      const changed = await api.patch<OnboardingApplication>(`/onboarding/applications/${item.id}`, {
        status: nextStatus,
        reviewNotes: nextStatus === 'REJECTED' ? 'اطلاعات یا مدارک برای فعال‌سازی کافی نیست.' : undefined,
      });
      setItems((current) => current.map((value) => value.id === item.id ? changed : value));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'بررسی درخواست انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['درخواست جدید', items.filter((item) => item.status === 'PENDING').length],
          ['در حال بررسی', items.filter((item) => item.status === 'UNDER_REVIEW').length],
          ['تأییدشده', items.filter((item) => item.status === 'APPROVED').length],
        ].map(([label, value]) => <MembershipCard key={String(label)}><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold">{Number(value).toLocaleString('fa-IR')}</p></MembershipCard>)}
      </div>
      <MembershipCard className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative"><Search className="pointer-events-none absolute right-4 top-3.5 size-4 text-muted" /><Input aria-label="جست‌وجوی درخواست‌ها" className="pr-11" placeholder="نام، موبایل، باشگاه یا تخصص..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select aria-label="فیلتر وضعیت درخواست" className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="PENDING">درخواست‌های جدید</option><option value="UNDER_REVIEW">در حال بررسی</option><option value="APPROVED">تأییدشده</option><option value="REJECTED">ردشده</option><option value="ALL">همه</option></select>
      </MembershipCard>
      {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="grid gap-4">
        {visible.map((item) => {
          const Icon = item.type === 'GYM_OWNER' ? Building2 : Stethoscope;
          return <MembershipCard key={item.id}><div className="flex flex-wrap items-start gap-4"><span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Icon className="size-5" /></span><div className="min-w-56 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-extrabold">{item.firstName} {item.lastName}</p><Badge tone="accent">{TYPE_LABEL[item.type]}</Badge><Badge tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{STATUS_LABEL[item.status]}</Badge></div><p className="mt-2 text-sm text-muted">{item.mobile} · {[item.province, item.city].filter(Boolean).join('، ')}</p><p className="mt-2 text-sm">{item.type === 'GYM_OWNER' ? item.gymName : item.specialty}</p>{item.address && <p className="mt-1 text-xs text-muted">{item.address}</p>}{item.notes && <p className="mt-3 rounded-xl bg-surface-raised px-3 py-2 text-xs leading-5 text-muted">{item.notes}</p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={busyId === item.id} onClick={() => review(item, 'UNDER_REVIEW')}>در حال بررسی</Button><Button size="sm" disabled={busyId === item.id} onClick={() => review(item, 'APPROVED')}>تأیید</Button><Button size="sm" variant="danger" disabled={busyId === item.id} onClick={() => review(item, 'REJECTED')}>رد</Button></div></div></MembershipCard>;
        })}
        {!visible.length && <MembershipCard className="py-12 text-center text-sm text-muted">درخواستی با این وضعیت پیدا نشد.</MembershipCard>}
      </div>
    </div>
  );
}
