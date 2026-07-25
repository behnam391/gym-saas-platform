'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, ShieldCheck, Stethoscope } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { IRAN_LOCATIONS, IRAN_PROVINCES } from '../../lib/iran-locations';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

type Mode = 'gym' | 'professional';
type ApplicationType = 'GYM_OWNER' | 'TRAINER' | 'NUTRITIONIST';

const initial = {
  firstName: '', lastName: '', nationalId: '', mobile: '', email: '',
  province: 'تهران', city: 'تهران', address: '', gymName: '',
  specialty: '', licenseNumber: '', notes: '',
};

export function OnboardingApplicationForm({ mode }: { mode: Mode }) {
  const [form, setForm] = useState(initial);
  const [type, setType] = useState<ApplicationType>(mode === 'gym' ? 'GYM_OWNER' : 'TRAINER');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cities = useMemo(() => IRAN_LOCATIONS[form.province] ?? [], [form.province]);
  const Icon = mode === 'gym' ? Building2 : Stethoscope;

  function update(key: keyof typeof initial, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    try {
      const result = await api.post<{ message: string }>('/onboarding/applications', {
        ...form,
        type,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        gymName: form.gymName.trim() || undefined,
        specialty: form.specialty.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setMessage(result.message);
      setForm(initial);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ارسال درخواست انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  const title = mode === 'gym' ? 'درخواست راه‌اندازی پنل باشگاه' : 'درخواست همکاری حرفه‌ای';
  const subtitle = mode === 'gym'
    ? 'اطلاعات مالک و مجموعه بررسی می‌شود؛ حساب مدیریتی از ثبت‌نام عمومی ساخته نمی‌شود.'
    : 'مربیان و متخصصان تغذیه پس از بررسی هویت و صلاحیت حرفه‌ای دسترسی دریافت می‌کنند.';

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(228,199,102,.15),transparent_33%),radial-gradient(circle_at_10%_90%,rgba(76,175,109,.10),transparent_30%)]" />
      <div className="relative mx-auto max-w-2xl">
        <Link href="/auth/register" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowRight className="size-4" /> انتخاب نوع ثبت‌نام</Link>
        <MembershipCard className="overflow-hidden p-0">
          <header className="border-b border-border/10 bg-surface-raised p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Icon className="size-5" /></span>
            <p className="mt-5 text-sm font-bold text-accent-soft">{mode === 'gym' ? 'ورود سازمانی' : 'احراز صلاحیت حرفه‌ای'}</p>
            <h1 className="mt-1 text-3xl font-extrabold">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
          </header>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8">
            {mode === 'professional' && <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">نوع همکاری<select className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={type} onChange={(event) => setType(event.target.value as ApplicationType)}><option value="TRAINER">مربی ورزشی</option><option value="NUTRITIONIST">متخصص تغذیه</option></select></label>}
            <Input label="نام" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} required />
            <Input label="نام خانوادگی" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} required />
            <Input label="کد ملی" inputMode="numeric" value={form.nationalId} onChange={(event) => update('nationalId', event.target.value)} required />
            <Input label="شماره موبایل" inputMode="tel" value={form.mobile} onChange={(event) => update('mobile', event.target.value)} required />
            <Input label="ایمیل (اختیاری)" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="sm:col-span-2" />
            {mode === 'gym' && <Input label="نام باشگاه یا مجموعه" value={form.gymName} onChange={(event) => update('gymName', event.target.value)} required className="sm:col-span-2" />}
            {mode === 'professional' && <><Input label="حوزه تخصص" placeholder="مثلاً بدنسازی یا تغذیه ورزشی" value={form.specialty} onChange={(event) => update('specialty', event.target.value)} required /><Input label="شماره مدرک یا مجوز (اختیاری)" value={form.licenseNumber} onChange={(event) => update('licenseNumber', event.target.value)} /></>}
            <label className="flex flex-col gap-1.5 text-sm text-muted">استان<select className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={form.province} onChange={(event) => { const province = event.target.value; setForm((current) => ({ ...current, province, city: IRAN_LOCATIONS[province]?.[0] ?? '' })); }}>{IRAN_PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}</select></label>
            <label className="flex flex-col gap-1.5 text-sm text-muted">شهر<select className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={form.city} onChange={(event) => update('city', event.target.value)}>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
            {mode === 'gym' && <Input label="آدرس مجموعه" value={form.address} onChange={(event) => update('address', event.target.value)} required className="sm:col-span-2" />}
            <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">توضیحات تکمیلی (اختیاری)<textarea className="min-h-28 rounded-xl border border-border/10 bg-surface p-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
            {message && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm leading-6 text-success sm:col-span-2">{message}</p>}
            {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full sm:col-span-2">{loading ? 'در حال ارسال…' : 'ثبت درخواست بررسی'}</Button>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted sm:col-span-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />ارسال این فرم حساب مدیریتی ایجاد نمی‌کند؛ فعال‌سازی پس از بررسی و تماس انجام می‌شود.</p>
          </form>
        </MembershipCard>
      </div>
    </main>
  );
}
