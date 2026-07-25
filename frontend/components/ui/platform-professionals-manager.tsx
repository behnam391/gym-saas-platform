'use client';

import { FormEvent, useState } from 'react';
import { Apple, Dumbbell, MapPin, Plus, Power, Star, Users } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface PlatformProfessional {
  id: string;
  type: 'TRAINER' | 'NUTRITIONIST';
  fullName: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  specialties: string[];
  province?: string | null;
  city?: string | null;
  serviceMode: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  consultationFee?: number | string | null;
  rating: number;
  isFeatured: boolean;
  isActive: boolean;
  _count?: { consultationRequests: number };
}

const EMPTY = {
  type: 'TRAINER' as 'TRAINER' | 'NUTRITIONIST',
  fullName: '',
  profileImageUrl: '',
  bio: '',
  specialties: '',
  province: '',
  city: '',
  serviceMode: 'ONLINE' as 'ONLINE' | 'IN_PERSON' | 'HYBRID',
  consultationFee: '',
  isFeatured: true,
};

const MODE_LABEL = { ONLINE: 'آنلاین', IN_PERSON: 'حضوری', HYBRID: 'آنلاین و حضوری' };

export function PlatformProfessionalsManager({ initial }: { initial: PlatformProfessional[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(null);
    try {
      const created = await api.post<PlatformProfessional>('/platform-professionals/admin', {
        ...form,
        profileImageUrl: form.profileImageUrl || undefined,
        bio: form.bio || undefined,
        province: form.province || undefined,
        city: form.city || undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        specialties: form.specialties.split('،').flatMap((part) => part.split(',')).map((item) => item.trim()).filter(Boolean),
      });
      setItems((current) => [created, ...current]);
      setForm(EMPTY);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'افزودن متخصص انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function toggle(item: PlatformProfessional) {
    const updated = await api.patch<PlatformProfessional>(`/platform-professionals/admin/${item.id}/access`, { isActive: !item.isActive });
    setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(400px,.8fr)]">
      <div className="grid content-start gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.type === 'TRAINER' ? Dumbbell : Apple;
          return (
            <MembershipCard key={item.id} className={!item.isActive ? 'opacity-65' : ''}>
              <div className="flex items-start gap-4">
                {item.profileImageUrl ? <img src={item.profileImageUrl} alt="" className="size-16 rounded-2xl object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Icon className="size-6" /></span>}
                <div className="min-w-0 flex-1"><p className="text-xs font-bold text-accent-soft">{item.type === 'TRAINER' ? 'مربی سراسری' : 'مشاور تغذیه سراسری'}</p><h3 className="mt-1 font-extrabold">{item.fullName}</h3><div className="mt-2 flex flex-wrap gap-2 text-xs text-muted"><span className="flex items-center gap-1"><Star className="size-3.5 text-accent" />{item.rating.toLocaleString('fa-IR')}</span>{item.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{item.city}</span>}</div></div>
              </div>
              {item.bio && <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{item.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">{item.specialties.map((specialty) => <span key={specialty} className="rounded-full bg-surface-raised px-2.5 py-1 text-xs">{specialty}</span>)}</div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/10 pt-4">
                <span className="flex items-center gap-1 text-xs text-muted"><Users className="size-3.5" />{(item._count?.consultationRequests ?? 0).toLocaleString('fa-IR')} درخواست</span>
                <Button type="button" size="sm" variant={item.isActive ? 'ghost' : 'secondary'} onClick={() => toggle(item)} className={item.isActive ? 'text-danger' : 'text-success'}><Power className="size-4" />{item.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</Button>
              </div>
            </MembershipCard>
          );
        })}
      </div>

      <MembershipCard>
        <div className="mb-5"><p className="flex items-center gap-2 font-extrabold"><Plus className="size-5 text-accent-soft" />افزودن متخصص سراسری</p><p className="mt-2 text-sm leading-6 text-muted">فقط افراد تأییدشدهٔ مدیریت اصلی در فهرست انتخاب همه ورزشکاران دیده می‌شوند.</p></div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-muted">نوع
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as typeof form.type })} className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink"><option value="TRAINER">مربی</option><option value="NUTRITIONIST">مشاور تغذیه</option></select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-muted">نحوه ارائه
            <select value={form.serviceMode} onChange={(event) => setForm({ ...form, serviceMode: event.target.value as typeof form.serviceMode })} className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink">{Object.entries(MODE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
          <Input label="نام و نام خانوادگی" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required className="sm:col-span-2" />
          <Input label="تخصص‌ها (با ویرگول)" value={form.specialties} onChange={(event) => setForm({ ...form, specialties: event.target.value })} required className="sm:col-span-2" />
          <Input label="استان" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} />
          <Input label="شهر" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <Input label="هزینه مشاوره (تومان)" inputMode="numeric" value={form.consultationFee} onChange={(event) => setForm({ ...form, consultationFee: event.target.value })} />
          <Input label="آدرس تصویر (اختیاری)" type="url" value={form.profileImageUrl} onChange={(event) => setForm({ ...form, profileImageUrl: event.target.value })} />
          <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">معرفی<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} className="rounded-xl border border-border/10 bg-surface p-4 text-ink focus:outline-none focus:ring-2 focus:ring-accent/50" /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />نمایش به‌عنوان متخصص پیشنهادی</label>
          {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
          <Button type="submit" disabled={loading} className="sm:col-span-2">{loading ? 'در حال افزودن…' : 'افزودن به فهرست سراسری'}</Button>
        </form>
      </MembershipCard>
    </div>
  );
}
