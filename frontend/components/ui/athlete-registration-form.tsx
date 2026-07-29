'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Dumbbell, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './brand-logo';
import { MembershipCard } from './membership-card';
import { Input } from './input';
import { Button } from './button';
import { api, ApiError } from '../../lib/api';
import { ContactVerification } from './contact-verification';

interface FormState {
  firstName: string;
  lastName: string;
  nationalId: string;
  mobile: string;
  email: string;
  password: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  city: string;
  address: string;
}

const initial: FormState = {
  firstName: '', lastName: '', nationalId: '', mobile: '', email: '',
  password: '', gender: 'MALE', dateOfBirth: '', city: '', address: '',
};

function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null); setLoading(true);
    try {
      const payload = {
        ...form,
        verificationToken,
        email: form.email.trim() || undefined,
        tenantId: searchParams.get('tenantId') ?? undefined,
        membershipPlanId: searchParams.get('membershipPlanId') ?? undefined,
      };
      const result = await api.post<{ message: string }>('/auth/register', payload);
      setMessage(result.message);
      setTimeout(() => router.push('/auth/login/athlete'), 1400);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت‌نام انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(76,175,109,.14),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(228,199,102,.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-2xl">
        <Link href="/" className="mb-7 flex w-fit" aria-label="صفحه اصلی گُردیار"><BrandLogo size="sm" /></Link>
        <Link href="/auth/register" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowRight className="size-4" /> انتخاب نوع ثبت‌نام</Link>
        <MembershipCard className="overflow-hidden p-0">
          <header className="border-b border-border/10 bg-surface-raised p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success"><Dumbbell className="size-5" /></span>
            <p className="mt-5 text-sm font-bold text-success">حساب شخصی ورزشکار</p>
            <h1 className="mt-1 text-3xl font-extrabold">ثبت‌نام ورزشکار</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{searchParams.has('membershipPlanId') ? 'باشگاه و پلن انتخاب‌شده پس از ثبت‌نام برای شما رزرو می‌شود.' : 'برای مشاهده برنامه‌ها، عضویت و سوابق ورزشی حساب بسازید.'}</p>
          </header>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <Input label="نام" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} required />
            <Input label="نام خانوادگی" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} required />
            <Input label="کد ملی" inputMode="numeric" value={form.nationalId} onChange={(event) => update('nationalId', event.target.value)} required className="sm:col-span-2" />
            <Input label="شماره موبایل" inputMode="tel" value={form.mobile} onChange={(event) => update('mobile', event.target.value)} required className="sm:col-span-2" />
            <Input label="ایمیل (اختیاری)" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="sm:col-span-2" />
            <ContactVerification
              mobile={form.mobile}
              email={form.email}
              purpose="REGISTER"
              onVerified={setVerificationToken}
            />
            <Input label="رمز عبور" type="password" minLength={8} value={form.password} onChange={(event) => update('password', event.target.value)} required className="sm:col-span-2" />
            <label className="flex flex-col gap-1.5 text-sm text-muted">جنسیت<select value={form.gender} onChange={(event) => update('gender', event.target.value as FormState['gender'])} className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink"><option value="MALE">مرد</option><option value="FEMALE">زن</option></select></label>
            <Input label="تاریخ تولد" type="date" value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} required />
            <Input label="شهر" value={form.city} onChange={(event) => update('city', event.target.value)} className="sm:col-span-2" />
            <Input label="آدرس (اختیاری)" value={form.address} onChange={(event) => update('address', event.target.value)} className="sm:col-span-2" />
            {message && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success sm:col-span-2">{message}</p>}
            {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">{error}</p>}
            <Button type="submit" disabled={loading || !verificationToken} className="mt-1 w-full sm:col-span-2">{loading ? 'در حال ساخت حساب…' : 'ساخت حساب ورزشکار'}</Button>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted sm:col-span-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />برای افراد زیر ۱۸ سال، برخی امکانات تا تأیید رضایت‌نامه والدین محدود می‌ماند.</p>
          </form>
        </MembershipCard>
      </div>
    </main>
  );
}

export function AthleteRegistrationForm() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center text-muted">در حال آماده‌سازی ثبت‌نام ورزشکار…</main>}><Form /></Suspense>;
}
