'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { Input } from './input';
import { Button } from './button';

export function GoalForm() {
  const router = useRouter(); const [type, setType] = useState('FAT_LOSS'); const [targetValue, setTargetValue] = useState(''); const [targetDate, setTargetDate] = useState(''); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(null); try { await api.post('/athletes/me/goals', { type, targetValue: targetValue ? Number(targetValue) : undefined, targetDate: targetDate || undefined }); setTargetValue(''); setTargetDate(''); router.refresh(); } catch (err) { setError(err instanceof ApiError ? err.message : 'ثبت هدف انجام نشد.'); } finally { setLoading(false); } }
  return <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3"><label className="flex flex-col gap-1.5 text-sm text-muted">نوع هدف<select className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={type} onChange={(event) => setType(event.target.value)}><option value="FAT_LOSS">کاهش چربی</option><option value="MUSCLE_GAIN">عضله‌سازی</option><option value="GENERAL_FITNESS">تناسب اندام</option><option value="ENDURANCE">استقامت</option><option value="REHABILITATION">بازتوانی</option></select></label><Input label="مقدار هدف" type="number" step="0.1" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} /><Input label="تاریخ هدف" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />{error && <p className="text-sm text-danger sm:col-span-3">{error}</p>}<Button type="submit" disabled={loading} className="sm:col-span-3 sm:w-fit">{loading ? 'در حال ثبت…' : 'افزودن هدف'}</Button></form>;
}

