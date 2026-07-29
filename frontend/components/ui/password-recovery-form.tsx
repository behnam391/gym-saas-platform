'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, KeyRound } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { LOGIN_PORTALS, LoginPortalKey } from '../../lib/login-portals';
import { BrandLogo } from './brand-logo';
import { Button } from './button';
import { ContactVerification } from './contact-verification';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export function PasswordRecoveryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPortal = searchParams.get('portal') as LoginPortalKey | null;
  const portal =
    requestedPortal && LOGIN_PORTALS[requestedPortal]
      ? requestedPortal
      : 'athlete';
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!verificationToken) return;
    if (password !== passwordAgain) {
      setError('تکرار رمز عبور با رمز جدید یکسان نیست.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', {
        verificationToken,
        newPassword: password,
      });
      router.replace(`/auth/login/${portal}?passwordChanged=1`);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'تغییر رمز عبور انجام نشد؛ دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(228,199,102,.16),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(76,175,109,.12),transparent_30%)]" />
      <div className="relative w-full max-w-lg">
        <Link href="/" className="mb-7 inline-flex">
          <BrandLogo size="sm" />
        </Link>
        <Link
          href={`/auth/login/${portal}`}
          className="mb-4 flex w-fit items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowRight className="size-4" />
          بازگشت به ورود
        </Link>
        <MembershipCard className="overflow-hidden p-0">
          <header className="border-b border-border/10 bg-surface-raised p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent-soft">
              <KeyRound className="size-5" />
            </span>
            <h1 className="mt-5 text-3xl font-extrabold">بازیابی رمز عبور</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              ابتدا شماره موبایل یا ایمیل ثبت‌شده را تأیید کنید.
            </p>
          </header>
          <form onSubmit={submit} className="grid gap-4 p-6 sm:p-8">
            <Input
              label="شماره موبایل"
              inputMode="tel"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
            />
            <Input
              label="ایمیل"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <ContactVerification
              mobile={mobile}
              email={email}
              purpose="RESET_PASSWORD"
              onVerified={setVerificationToken}
            />
            {verificationToken && (
              <>
                <Input
                  label="رمز عبور جدید"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Input
                  label="تکرار رمز عبور جدید"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordAgain}
                  onChange={(event) => setPasswordAgain(event.target.value)}
                  required
                />
              </>
            )}
            {error && (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={
                busy ||
                !verificationToken ||
                password.length < 8 ||
                password !== passwordAgain
              }
            >
              {busy ? 'در حال تغییر رمز…' : 'ثبت رمز عبور جدید'}
            </Button>
          </form>
        </MembershipCard>
      </div>
    </main>
  );
}
