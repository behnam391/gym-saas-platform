'use client';

import { useState } from 'react';
import { Apple, CalendarCheck, Dumbbell, MapPin, MessageCircle, Star } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button } from './button';
import { MembershipCard } from './membership-card';
import { PlatformProfessional } from './platform-professionals-manager';

interface Consultation {
  id: string;
  professionalId: string;
  status: 'REQUESTED' | 'CONTACTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

const STATUS_LABEL = { REQUESTED: 'در انتظار بررسی', CONTACTED: 'تماس گرفته شد', CONFIRMED: 'تأیید شده', COMPLETED: 'انجام شده', CANCELLED: 'لغو شده' };
const MODE_LABEL = { ONLINE: 'آنلاین', IN_PERSON: 'حضوری', HYBRID: 'آنلاین و حضوری' };

export function AthleteExpertsDirectory({ initial, requests }: { initial: PlatformProfessional[]; requests: Consultation[] }) {
  const [filter, setFilter] = useState<'ALL' | 'TRAINER' | 'NUTRITIONIST'>('ALL');
  const [mine, setMine] = useState(requests);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const visible = filter === 'ALL' ? initial : initial.filter((item) => item.type === filter);

  async function request(item: PlatformProfessional) {
    setLoadingId(item.id); setNotice(null);
    try {
      const created = await api.post<Consultation & { message: string }>(`/platform-professionals/${item.id}/consultations`, { message: messages[item.id] || undefined });
      setMine((current) => [created, ...current]);
      setNotice(created.message);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'ثبت درخواست انجام نشد.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {([['ALL', 'همه'], ['TRAINER', 'مربیان'], ['NUTRITIONIST', 'مشاوران تغذیه']] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant={filter === value ? 'primary' : 'secondary'} onClick={() => setFilter(value)}>{label}</Button>)}
      </div>
      {notice && <p className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm">{notice}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {visible.map((item) => {
          const Icon = item.type === 'TRAINER' ? Dumbbell : Apple;
          const open = mine.find((entry) => entry.professionalId === item.id && ['REQUESTED', 'CONTACTED', 'CONFIRMED'].includes(entry.status));
          return (
            <MembershipCard key={item.id}>
              <div className="flex items-start gap-4">
                {item.profileImageUrl ? <img src={item.profileImageUrl} alt={`تصویر ${item.fullName}`} className="size-20 rounded-2xl object-cover" /> : <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Icon className="size-7" /></span>}
                <div className="min-w-0 flex-1"><p className="text-xs font-bold text-accent-soft">{item.type === 'TRAINER' ? 'مربی منتخب سراسری' : 'مشاور تغذیه منتخب سراسری'}</p><h2 className="mt-1 text-lg font-extrabold">{item.fullName}</h2><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted"><span className="flex items-center gap-1"><Star className="size-3.5 text-accent" />{item.rating.toLocaleString('fa-IR')}</span><span>{MODE_LABEL[item.serviceMode]}</span>{item.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{item.city}</span>}</div></div>
              </div>
              {item.bio && <p className="mt-4 text-sm leading-6 text-muted">{item.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">{item.specialties.map((specialty) => <span key={specialty} className="rounded-full bg-surface-raised px-2.5 py-1 text-xs">{specialty}</span>)}</div>
              <div className="mt-5 border-t border-border/10 pt-4">
                {open ? <p className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm font-bold text-success"><CalendarCheck className="size-4" />{STATUS_LABEL[open.status]}</p> : <>
                  <label className="text-xs text-muted">توضیح کوتاه برای متخصص<textarea value={messages[item.id] ?? ''} onChange={(event) => setMessages({ ...messages, [item.id]: event.target.value })} rows={2} placeholder="هدف، شرایط یا زمان مناسب برای تماس" className="mt-2 w-full rounded-xl border border-border/10 bg-surface p-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50" /></label>
                  <div className="mt-3 flex items-center justify-between gap-3"><span className="text-sm font-extrabold">{item.consultationFee ? `${Number(item.consultationFee).toLocaleString('fa-IR')} تومان` : 'توافقی'}</span><Button type="button" size="sm" disabled={loadingId === item.id} onClick={() => request(item)}><MessageCircle className="size-4" />{loadingId === item.id ? 'در حال ثبت…' : 'درخواست مشاوره'}</Button></div>
                </>}
              </div>
            </MembershipCard>
          );
        })}
      </div>
    </div>
  );
}
