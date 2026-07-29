'use client';

import { FormEvent, useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Input } from './input';
import { Button } from './button';

const portalByRole: Record<string, string> = {
  SUPER_ADMIN: 'admin',
  GYM_OWNER: 'owner',
  RECEPTION: 'reception',
  BUFFET_STAFF: 'buffet',
  TRAINER: 'trainer',
  NUTRITIONIST: 'nutritionist',
  ATHLETE: 'athlete',
};

export function AccountSecurityPanel({ role }: { role: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError('تکرار رمز عبور با رمز جدید یکسان نیست.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      await api.post('/auth/logout').catch(() => undefined);
      const portal = portalByRole[role] ?? 'athlete';
      router.replace(`/auth/login/${portal}?passwordChanged=1`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'تغییر رمز عبور انجام نشد؛ دوباره تلاش کنید.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MembershipCard>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">امنیت حساب</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            بعد از تغییر رمز، همه نشست‌های وب و موبایل بسته می‌شوند و باید با رمز جدید وارد شوید.
          </p>
        </div>
      </div>

      <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="رمز عبور فعلی"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(event) =>
            setForm({ ...form, currentPassword: event.target.value })
          }
          required
        />
        <span className="hidden sm:block" aria-hidden="true" />
        <Input
          label="رمز عبور جدید"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={form.newPassword}
          onChange={(event) =>
            setForm({ ...form, newPassword: event.target.value })
          }
          required
        />
        <Input
          label="تکرار رمز عبور جدید"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={form.confirmPassword}
          onChange={(event) =>
            setForm({ ...form, confirmPassword: event.target.value })
          }
          required
        />
        {error && (
          <p className="text-sm text-danger sm:col-span-2">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="sm:w-fit">
          <LockKeyhole className="size-4" />
          {loading ? 'در حال تغییر…' : 'تغییر رمز عبور'}
        </Button>
      </form>
    </MembershipCard>
  );
}
