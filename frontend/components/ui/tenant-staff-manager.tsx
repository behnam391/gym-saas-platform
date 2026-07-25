'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, KeyRound, Plus, Power, UserCog } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button, buttonStyles } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

type StaffRole = 'RECEPTION' | 'BUFFET_STAFF' | 'TRAINER' | 'NUTRITIONIST';

export interface TenantStaff {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  trainerProfile?: { specialties: string[]; status: string } | null;
  nutritionistProfile?: { status: string } | null;
}

const ROLE_META: Record<StaffRole, { label: string; login: string }> = {
  RECEPTION: { label: 'پذیرش', login: '/auth/login/reception' },
  BUFFET_STAFF: { label: 'بوفه‌دار', login: '/auth/login/buffet' },
  TRAINER: { label: 'مربی باشگاه', login: '/auth/login/trainer' },
  NUTRITIONIST: { label: 'مشاور تغذیه باشگاه', login: '/auth/login/nutritionist' },
};

const EMPTY = {
  role: 'RECEPTION' as StaffRole,
  firstName: '',
  lastName: '',
  nationalId: '',
  mobile: '',
  email: '',
  gender: 'MALE',
  dateOfBirth: '1995-01-01',
  specialties: '',
  bio: '',
};

export function TenantStaffManager({ initial }: { initial: TenantStaff[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<{ name: string; mobile: string; password: string; login: string } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(null); setCredential(null);
    try {
      const created = await api.post<TenantStaff & { temporaryPassword: string }>('/tenant-staff', {
        ...form,
        email: form.email || undefined,
        specialties: form.specialties.split('،').flatMap((part) => part.split(',')).map((item) => item.trim()).filter(Boolean),
        bio: form.bio || undefined,
      });
      setItems((current) => [created, ...current]);
      setCredential({
        name: `${created.firstName} ${created.lastName}`,
        mobile: created.mobile,
        password: created.temporaryPassword,
        login: ROLE_META[created.role].login,
      });
      setForm(EMPTY);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ساخت حساب انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function toggle(item: TenantStaff) {
    const updated = await api.patch<TenantStaff>(`/tenant-staff/${item.id}/access`, { isActive: !item.isActive });
    setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,.85fr)]">
      <div className="space-y-4">
        {credential && (
          <MembershipCard className="border-success/30 bg-success/5">
            <p className="flex items-center gap-2 font-extrabold text-success"><CheckCircle2 className="size-5" />حساب {credential.name} ساخته شد</p>
            <p className="mt-2 text-sm leading-6 text-muted">این رمز فقط همین یک بار نمایش داده می‌شود؛ آن را امن برای همکار ارسال کنید.</p>
            <div className="mt-4 grid gap-3 rounded-2xl bg-base/60 p-4 text-sm sm:grid-cols-2">
              <div><span className="text-muted">نام کاربری</span><p className="mt-1 font-bold dir-ltr">{credential.mobile}</p></div>
              <div><span className="text-muted">رمز موقت</span><p className="mt-1 font-bold dir-ltr">{credential.password}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => navigator.clipboard.writeText(`نام کاربری: ${credential.mobile}\nرمز: ${credential.password}\nلینک ورود: ${location.origin}${credential.login}`)}><Copy className="size-4" />کپی اطلاعات ورود</Button>
              <a href={credential.login} target="_blank" className={buttonStyles({ variant: 'secondary', size: 'sm' })}><ExternalLink className="size-4" />باز کردن درگاه اختصاصی</a>
            </div>
          </MembershipCard>
        )}
        {items.length === 0 ? (
          <MembershipCard className="grid min-h-48 place-items-center text-center text-muted"><div><UserCog className="mx-auto mb-3 size-8" /><p>هنوز حساب پرسنلی ساخته نشده است.</p></div></MembershipCard>
        ) : items.map((item) => {
          const meta = ROLE_META[item.role];
          return (
            <MembershipCard key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><UserCog className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{item.firstName} {item.lastName}</h3><span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-bold">{meta.label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{item.isActive ? 'فعال' : 'غیرفعال'}</span></div>
                <p className="mt-2 text-sm text-muted">{item.mobile}{item.email ? ` · ${item.email}` : ''}</p>
                {item.trainerProfile?.specialties?.length ? <p className="mt-2 text-xs text-muted">{item.trainerProfile.specialties.join('، ')}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={meta.login} target="_blank" className={buttonStyles({ variant: 'secondary', size: 'sm' })}><KeyRound className="size-4" />لینک ورود</a>
                <Button type="button" size="sm" variant={item.isActive ? 'ghost' : 'secondary'} onClick={() => toggle(item)} className={item.isActive ? 'text-danger' : 'text-success'}><Power className="size-4" />{item.isActive ? 'قطع دسترسی' : 'فعال‌سازی'}</Button>
              </div>
            </MembershipCard>
          );
        })}
      </div>

      <MembershipCard>
        <div className="mb-5"><p className="flex items-center gap-2 font-extrabold"><Plus className="size-5 text-accent-soft" />ساخت حساب همکار</p><p className="mt-2 text-sm leading-6 text-muted">حساب به همین باشگاه متصل می‌شود و رمز موقت امن دریافت می‌کند.</p></div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">نقش
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })} className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink">
              {Object.entries(ROLE_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </select>
          </label>
          <Input label="نام" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
          <Input label="نام خانوادگی" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
          <Input label="کد ملی" inputMode="numeric" maxLength={10} value={form.nationalId} onChange={(event) => setForm({ ...form, nationalId: event.target.value })} required />
          <Input label="شماره موبایل" inputMode="tel" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} required />
          <Input label="ایمیل (اختیاری)" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Input label="تاریخ تولد" type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} required />
          <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">جنسیت
            <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink"><option value="MALE">مرد</option><option value="FEMALE">زن</option></select>
          </label>
          {(form.role === 'TRAINER' || form.role === 'NUTRITIONIST') && <>
            <Input label="تخصص‌ها (با ویرگول جدا کنید)" value={form.specialties} onChange={(event) => setForm({ ...form, specialties: event.target.value })} className="sm:col-span-2" />
            <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">معرفی کوتاه<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} className="rounded-xl border border-border/10 bg-surface p-4 text-ink focus:outline-none focus:ring-2 focus:ring-accent/50" /></label>
          </>}
          {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
          <Button type="submit" disabled={loading} className="sm:col-span-2">{loading ? 'در حال ساخت حساب…' : 'ساخت حساب و رمز موقت'}</Button>
        </form>
      </MembershipCard>
    </div>
  );
}
