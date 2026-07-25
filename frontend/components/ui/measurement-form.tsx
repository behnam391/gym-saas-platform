'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { Input } from './input';
import { Button } from './button';

const FIELDS = [
  ['weightKg', 'وزن (کیلوگرم)'], ['waistCm', 'دور کمر'], ['chestCm', 'دور سینه'], ['armCm', 'دور بازو'], ['thighCm', 'دور ران'], ['calfCm', 'دور ساق'], ['neckCm', 'دور گردن'], ['shoulderCm', 'دور شانه'], ['bodyFatPercent', 'درصد چربی بدن'],
] as const;

export function MeasurementForm() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setStatus(null);
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value).map(([key, value]) => [key, Number(value)]));
    try {
      await api.post('/athletes/me/measurements', payload);
      setStatus({ type: 'ok', text: 'اندازه‌گیری جدید ثبت شد.' }); setForm({}); router.refresh();
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof ApiError ? err.message : 'ثبت اندازه‌گیری انجام نشد.' });
    } finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">{FIELDS.map(([key, label]) => <Input key={key} label={label} type="number" step="0.1" value={form[key] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />)}{status && <p className={`text-sm sm:col-span-3 ${status.type === 'ok' ? 'text-success' : 'text-danger'}`}>{status.text}</p>}<Button type="submit" disabled={loading} className="sm:col-span-3 sm:w-fit">{loading ? 'در حال ثبت…' : 'ثبت اندازه‌گیری'}</Button></form>;
}

