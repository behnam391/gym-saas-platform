'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { api, ApiError } from '../../../lib/api';
import { dashboardForRole } from '../../../lib/auth';

const DEMO_ACCOUNTS = [
  { label: 'ورزشکار', identifier: '09120000002' },
  { label: 'صاحب باشگاه', identifier: '09120000001' },
  { label: 'مربی', identifier: '09120000003' },
  { label: 'متخصص تغذیه', identifier: '09120000004' },
  { label: 'پذیرش', identifier: '09120000005' },
  { label: 'مدیر ارشد', identifier: '09120000000' },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ role: string; tenantId: string | null }>(
        '/auth/login',
        { identifier, password },
      );
      router.replace(dashboardForRole(res.role));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطایی رخ داد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <MembershipCard className="w-full">
        <h1 className="mb-1 text-2xl font-extrabold">ورود به حساب کاربری</h1>
        <p className="mb-6 text-sm text-muted">با موبایل یا کد ملی خود وارد شوید.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="موبایل یا کد ملی"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <Input
            label="رمز عبور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'در حال ورود…' : 'ورود'}
          </Button>
        </form>

        {isDemo && (
          <div className="mt-6 border-t border-border/10 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold">ورود سریع نسخه نمایشی</p>
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent-soft">
                رمز: demo1234
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.identifier}
                  type="button"
                  onClick={() => {
                    setIdentifier(account.identifier);
                    setPassword('demo1234');
                    setError(null);
                  }}
                  className="rounded-xl border border-border/10 bg-surface-raised px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink"
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              یک نقش را انتخاب کنید و سپس دکمه ورود را بزنید. اطلاعات این بخش صرفاً برای اجرای محلی است.
            </p>
          </div>
        )}
      </MembershipCard>
    </main>
  );
}
