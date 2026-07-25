'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { dashboardForRole } from '../../lib/auth';
import { LOGIN_PORTALS, LoginPortalKey } from '../../lib/login-portals';
import { MembershipCard } from './membership-card';
import { Input } from './input';
import { Button } from './button';

export function PortalLoginForm({ portal }: { portal: LoginPortalKey }) {
  const config = LOGIN_PORTALS[portal];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const showDemo = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await api.post<{ role: string }>('/auth/login', { identifier, password });
      if (session.role !== config.role) {
        await api.post('/auth/logout');
        setError(`این حساب متعلق به درگاه «${config.title}» نیست. درگاه درست را انتخاب کنید.`);
        return;
      }
      const requested = searchParams.get('next');
      const dashboard = dashboardForRole(session.role);
      router.replace(requested?.startsWith(dashboard) ? requested : dashboard);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ورود انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setIdentifier(config.identifier);
    setPassword('demo1234');
    setError(null);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(228,199,102,.16),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(76,175,109,.12),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <Link href="/auth/login" className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink">
          <ArrowRight className="size-4" /> انتخاب درگاه دیگر
        </Link>
        <MembershipCard className="overflow-hidden p-0">
          <div className="border-b border-border/10 bg-surface-raised p-6 sm:p-8">
            <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent-soft"><LockKeyhole className="size-5" /></div>
            <p className="text-sm font-semibold text-accent-soft">درگاه اختصاصی</p>
            <h1 className="mt-1 text-3xl font-extrabold">ورود {config.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{config.subtitle}</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4 p-6 sm:p-8">
            <Input label="شماره موبایل یا کد ملی" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
            <Input label="رمز عبور" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-1 w-full">{loading ? 'در حال ورود…' : `ورود به پنل ${config.title}`}</Button>
            {showDemo && (
              <button type="button" onClick={fillDemo} className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-bold text-accent-soft transition hover:bg-accent/10">
                تکمیل خودکار حساب نمایشی
              </button>
            )}
            <p className="flex items-start gap-2 text-xs leading-5 text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />نشست ورود در کوکی امن نگهداری می‌شود و نقش حساب در همین درگاه کنترل خواهد شد.</p>
          </form>
        </MembershipCard>
      </div>
    </main>
  );
}
