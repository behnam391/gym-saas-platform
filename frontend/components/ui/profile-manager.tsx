'use client';

import { useRef, useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Input } from './input';
import { Button } from './button';

export interface BasicProfile {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  role: string;
  city?: string | null;
  address?: string | null;
  profileImageUrl?: string | null;
}

export function ProfileManager({ initial }: { initial: BasicProfile }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initial);
  const [form, setForm] = useState({ firstName: initial.firstName, lastName: initial.lastName, city: initial.city ?? '', address: initial.address ?? '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadAvatar(file?: File) {
    if (!file) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      const data = new FormData();
      data.append('purpose', 'PROFILE_IMAGE');
      data.append('file', file);
      const response = await fetch('/api/backend/uploads/local', { method: 'POST', body: data });
      const uploaded = await response.json();
      if (!response.ok) throw new Error(Array.isArray(uploaded.message) ? uploaded.message.join('، ') : uploaded.message);
      const updated = await api.patch<BasicProfile>('/profiles/me', { profileImageUrl: uploaded.url });
      setProfile(updated);
      setMessage('تصویر پروفایل با موفقیت ذخیره شد.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'آپلود تصویر انجام نشد.');
    } finally { setLoading(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(null); setMessage(null);
    try {
      const updated = await api.patch<BasicProfile>('/profiles/me', form);
      setProfile(updated); setMessage('اطلاعات پروفایل ذخیره شد.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ذخیره اطلاعات انجام نشد.');
    } finally { setLoading(false); }
  }

  return (
    <MembershipCard>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} className="group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl border border-border/10 bg-surface-raised">
          {profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="تصویر پروفایل" className="size-full object-cover" /> : <UserRound className="size-9 text-muted" />}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-base/80 py-1.5 text-[11px] opacity-0 transition group-hover:opacity-100"><Camera className="size-3" /> تغییر</span>
        </button>
        <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadAvatar(event.target.files?.[0])} />
        <div><h2 className="text-xl font-extrabold">{profile.firstName} {profile.lastName}</h2><p className="mt-1 text-sm text-muted">{profile.mobile}</p><Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={loading} className="mt-2">انتخاب عکس</Button></div>
      </div>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Input label="نام" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
        <Input label="نام خانوادگی" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
        <Input label="شهر" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <Input label="آدرس" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        {message && <p className="text-sm text-success sm:col-span-2">{message}</p>}
        {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:w-fit">{loading ? 'در حال ذخیره…' : 'ذخیره پروفایل'}</Button>
      </form>
    </MembershipCard>
  );
}
