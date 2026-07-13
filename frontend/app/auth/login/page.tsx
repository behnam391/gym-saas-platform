'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { api, ApiError } from '../../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        { identifier, password },
      );
      // Production: store accessToken in memory + refreshToken in an
      // httpOnly cookie set by a Next.js Route Handler — never localStorage.
      sessionStorage.setItem('accessToken', res.accessToken);
      router.push('/dashboard/athlete');
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
      </MembershipCard>
    </main>
  );
}
