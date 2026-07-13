'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { api, ApiError } from '../../../lib/api';

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
  firstName: '',
  lastName: '',
  nationalId: '',
  mobile: '',
  email: '',
  password: '',
  gender: 'MALE',
  dateOfBirth: '',
  city: '',
  address: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/auth/register', form);
      setMessage(res.message);
      setTimeout(() => router.push('/auth/login'), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطایی رخ داد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
      <MembershipCard className="w-full">
        <h1 className="mb-1 text-2xl font-extrabold">ثبت‌نام در سامانه</h1>
        <p className="mb-6 text-sm text-muted">
          اگر سن شما کمتر از ۱۸ سال است، حساب کاربری تا تایید رضایت‌نامه والدین محدود خواهد بود.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <Input label="نام" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
          <Input label="نام خانوادگی" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
          <Input label="کد ملی" value={form.nationalId} onChange={(e) => update('nationalId', e.target.value)} required className="col-span-2" />
          <Input label="موبایل" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} required className="col-span-2" />
          <Input label="ایمیل (اختیاری)" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="col-span-2" />
          <Input label="رمز عبور" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required className="col-span-2" />

          <div className="col-span-1 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">جنسیت</label>
            <select
              value={form.gender}
              onChange={(e) => update('gender', e.target.value as 'MALE' | 'FEMALE')}
              className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink"
            >
              <option value="MALE">مرد</option>
              <option value="FEMALE">زن</option>
            </select>
          </div>
          <Input
            label="تاریخ تولد"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            required
          />
          <Input label="شهر" value={form.city} onChange={(e) => update('city', e.target.value)} className="col-span-2" />
          <Input label="آدرس" value={form.address} onChange={(e) => update('address', e.target.value)} className="col-span-2" />

          {message && <p className="col-span-2 text-sm text-success">{message}</p>}
          {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={loading} className="col-span-2 mt-2 w-full">
            {loading ? 'در حال ثبت‌نام…' : 'ثبت‌نام'}
          </Button>
        </form>
      </MembershipCard>
    </main>
  );
}
