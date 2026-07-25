'use client';

import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';

interface Advertisement { id: string; title: string; province: string; city?: string | null; status: string; dailyBudget?: number | null; rejectionReason?: string | null; }
const STATUS: Record<string, { label: string; tone: 'muted' | 'warning' | 'success' | 'danger' }> = { DRAFT: { label: 'پیش‌نویس', tone: 'muted' }, PENDING: { label: 'در انتظار تایید', tone: 'warning' }, APPROVED: { label: 'فعال', tone: 'success' }, REJECTED: { label: 'رد شده', tone: 'danger' }, PAUSED: { label: 'متوقف', tone: 'muted' }, EXPIRED: { label: 'پایان‌یافته', tone: 'muted' } };

export function AdvertisementsManager({ initial }: { initial: Advertisement[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({ title: '', description: '', province: 'تهران', city: 'تهران', dailyBudget: '250000' });
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    try { const created = await api.post<Advertisement>('/advertisements', { ...form, city: form.city || undefined, dailyBudget: Number(form.dailyBudget) }); setItems((current) => [created, ...current]); setForm({ ...form, title: '', description: '' }); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'درخواست تبلیغ ثبت نشد.'); } finally { setLoading(false); }
  }
  return <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]"><MembershipCard><h2 className="font-extrabold">درخواست جایگاه تبلیغاتی</h2><p className="mb-5 mt-1 text-sm text-muted">پس از تایید مدیر سامانه، تبلیغ در استان و شهر انتخابی نمایش داده می‌شود.</p><form onSubmit={submit} className="flex flex-col gap-3"><Input label="عنوان تبلیغ" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /><label className="flex flex-col gap-1.5 text-sm text-muted">توضیح کوتاه<textarea className="min-h-24 rounded-xl border border-border/10 bg-surface px-4 py-3 text-ink" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className="grid gap-3 sm:grid-cols-2"><Input label="استان" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required /><Input label="شهرستان / شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div><Input label="بودجه روزانه (تومان)" type="number" value={form.dailyBudget} onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })} required />{error && <p className="text-sm text-danger">{error}</p>}<Button type="submit" disabled={loading}><Megaphone className="size-4" />{loading ? 'در حال ثبت…' : 'ارسال برای بررسی'}</Button></form></MembershipCard><div className="flex flex-col gap-3">{items.length === 0 && <MembershipCard className="text-center text-muted">درخواستی ثبت نشده است.</MembershipCard>}{items.map((item) => { const status = STATUS[item.status] ?? STATUS.DRAFT; return <MembershipCard key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-muted">{item.province}{item.city ? `، ${item.city}` : '، تمام استان'}</p></div><Badge tone={status.tone}>{status.label}</Badge></div>{item.dailyBudget != null && <p className="mt-4 text-sm">بودجه روزانه: <strong>{Number(item.dailyBudget).toLocaleString('fa-IR')} تومان</strong></p>}{item.rejectionReason && <p className="mt-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{item.rejectionReason}</p>}</MembershipCard>; })}</div></div>;
}
