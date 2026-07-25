'use client';

import { FormEvent, useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface AthleteTicket { id: string; subject: string; description: string; status: string; priority: string; createdAt: string }
const STATUS: Record<string, string> = { OPEN: 'باز', IN_PROGRESS: 'در حال بررسی', RESOLVED: 'حل‌شده', CLOSED: 'بسته‌شده' };
const PRIORITY: Record<string, string> = { LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'بالا', CRITICAL: 'فوری' };

export function AthleteTicketsPanel({ initial }: { initial: AthleteTicket[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const ticket = await api.post<AthleteTicket>('/tickets', { targetType: 'GYM', subject, description, priority });
      setItems((list) => [ticket, ...list]); setSubject(''); setDescription(''); setOpen(false);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'ثبت درخواست انجام نشد.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end"><Button onClick={() => setOpen((value) => !value)}><Plus className="size-4" />درخواست جدید</Button></div>
      {open && <MembershipCard><form onSubmit={create} className="grid gap-4"><Input label="موضوع درخواست" value={subject} onChange={(event) => setSubject(event.target.value)} required /><label className="grid gap-1.5 text-sm"><span className="font-medium text-muted">توضیحات</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} className="rounded-xl border border-white/10 bg-surface p-3 outline-none focus:border-accent" /></label><label className="grid gap-1.5 text-sm"><span className="font-medium text-muted">اولویت</span><select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-surface px-3"><option value="LOW">کم</option><option value="MEDIUM">متوسط</option><option value="HIGH">بالا</option><option value="CRITICAL">فوری</option></select></label>{error && <p className="text-sm text-danger">{error}</p>}<Button type="submit" disabled={busy || !subject.trim() || !description.trim()}>{busy ? 'در حال ثبت…' : 'ثبت درخواست'}</Button></form></MembershipCard>}
      {!items.length ? <MembershipCard className="text-center text-muted"><LifeBuoy className="mx-auto mb-3 size-9" />هنوز درخواستی ثبت نکرده‌اید.</MembershipCard> : items.map((item) => <MembershipCard key={item.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold">{item.subject}</h2><p className="mt-2 text-sm leading-6 text-muted">{item.description}</p><p className="mt-3 text-xs text-muted">{new Date(item.createdAt).toLocaleDateString('fa-IR-u-ca-persian')}</p></div><div className="flex gap-2"><Badge tone={item.priority === 'CRITICAL' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'muted'}>{PRIORITY[item.priority] ?? item.priority}</Badge><Badge tone={item.status === 'RESOLVED' ? 'success' : 'accent'}>{STATUS[item.status] ?? item.status}</Badge></div></div></MembershipCard>)}
    </div>
  );
}
