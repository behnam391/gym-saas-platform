'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail, MessageSquareText } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button } from './button';
import { Input } from './input';

type Purpose = 'REGISTER' | 'ONBOARDING' | 'RESET_PASSWORD' | 'LOGIN';
type Channel = 'SMS' | 'EMAIL';

interface Props {
  mobile?: string;
  email?: string;
  purpose: Purpose;
  onVerified: (token: string | null) => void;
}

export function ContactVerification({
  mobile = '',
  email = '',
  purpose,
  onVerified,
}: Props) {
  const [channel, setChannel] = useState<Channel>('SMS');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verifiedDestination, setVerifiedDestination] = useState<string | null>(
    null,
  );
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [, setClock] = useState(0);
  const destination = useMemo(
    () => (channel === 'SMS' ? mobile.trim() : email.trim().toLowerCase()),
    [channel, email, mobile],
  );

  useEffect(() => {
    if (verifiedDestination && verifiedDestination !== destination) {
      setVerifiedDestination(null);
      setChallengeId(null);
      setCode('');
      onVerified(null);
    }
  }, [destination, onVerified, verifiedDestination]);

  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  const remaining = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));

  async function requestCode() {
    setBusy(true);
    setError(null);
    setMessage(null);
    onVerified(null);
    try {
      const result = await api.post<{
        challengeId: string;
        retryAfterSeconds: number;
        message: string;
        debugCode?: string;
      }>('/auth/otp/request', { channel, purpose, destination });
      setChallengeId(result.challengeId);
      setRetryAt(Date.now() + result.retryAfterSeconds * 1000);
      setMessage(
        result.debugCode
          ? `${result.message} کد محیط آزمایشی: ${result.debugCode}`
          : result.message,
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'ارسال کد انجام نشد؛ دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!challengeId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{
        verificationToken: string;
        destination: string;
        message: string;
      }>('/auth/otp/verify', { challengeId, code });
      setVerifiedDestination(result.destination);
      onVerified(result.verificationToken);
      setMessage(result.message);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'بررسی کد انجام نشد؛ دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border/10 bg-surface-raised p-4 sm:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">تأیید هویت</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            کد یک‌بارمصرف ۶ رقمی تا ۵ دقیقه معتبر است.
          </p>
        </div>
        {verifiedDestination && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
            <CheckCircle2 className="size-4" />
            تأیید شد
          </span>
        )}
      </div>

      {!verifiedDestination && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setChannel('SMS');
                setChallengeId(null);
                setCode('');
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                channel === 'SMS'
                  ? 'border-accent/50 bg-accent/10 text-accent-soft'
                  : 'border-border/10 text-muted'
              }`}
            >
              <MessageSquareText className="size-4" />
              پیامک
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel('EMAIL');
                setChallengeId(null);
                setCode('');
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                channel === 'EMAIL'
                  ? 'border-accent/50 bg-accent/10 text-accent-soft'
                  : 'border-border/10 text-muted'
              }`}
            >
              <Mail className="size-4" />
              ایمیل
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {challengeId ? (
              <Input
                label="کد تأیید"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="flex-1"
              />
            ) : (
              <p className="flex-1 rounded-xl bg-surface px-3 py-3 text-sm text-muted">
                {destination ||
                  (channel === 'SMS'
                    ? 'ابتدا شماره موبایل را وارد کنید.'
                    : 'ابتدا ایمیل را وارد کنید.')}
              </p>
            )}
            {challengeId ? (
              <Button
                type="button"
                onClick={verifyCode}
                disabled={busy || code.length !== 6}
              >
                تأیید کد
              </Button>
            ) : (
              <Button
                type="button"
                onClick={requestCode}
                disabled={busy || !destination}
              >
                {busy ? 'در حال ارسال…' : 'ارسال کد'}
              </Button>
            )}
          </div>
          {challengeId && (
            <button
              type="button"
              onClick={requestCode}
              disabled={busy || remaining > 0}
              className="mt-3 text-xs font-bold text-accent-soft disabled:text-muted"
            >
              {remaining > 0
                ? `ارسال مجدد تا ${remaining} ثانیه دیگر`
                : 'ارسال مجدد کد'}
            </button>
          )}
        </>
      )}

      {message && (
        <p className="mt-3 rounded-xl bg-success/10 px-3 py-2 text-xs leading-5 text-success">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs leading-5 text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
