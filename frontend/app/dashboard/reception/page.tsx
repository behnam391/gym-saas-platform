'use client';

import { useState } from 'react';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { api, ApiError } from '../../../lib/api';

export default function ReceptionOverviewPage() {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken') ?? undefined;
      await api.post('/attendance/check-in', { userId, method: 'MANUAL' }, { accessToken: token });
      setMessage('حضور با موفقیت ثبت شد.');
      setUserId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطایی رخ داد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">نمای کلی پذیرش</h1>
        <p className="text-muted">ثبت حضور سریع اعضا با شناسه کاربری، کارت یا QR</p>
      </header>

      <MembershipCard className="max-w-md">
        <h2 className="mb-4 font-bold">ثبت حضور دستی</h2>
        <form onSubmit={handleCheckIn} className="flex flex-col gap-3">
          <Input
            label="شناسه کاربری عضو"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="در نسخه نهایی: اسکن QR یا کارت عضویت"
            required
          />
          {message && <p className="text-sm text-success">{message}</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'در حال ثبت…' : 'ثبت حضور'}
          </Button>
        </form>
      </MembershipCard>
    </div>
  );
}
