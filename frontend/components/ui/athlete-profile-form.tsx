'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { Input } from './input';
import { Button } from './button';

interface AthleteProfileFormProps {
  initial: {
    heightCm?: number | null;
    weightKg?: number | null;
    fitnessGoal?: string | null;
    trainingLevel?: string | null;
    activityLevel?: string | null;
    trainingHistory?: string | null;
    injuries?: string | null;
    illnesses?: string | null;
    medications?: string | null;
    allergies?: string | null;
  };
}

export function AthleteProfileForm({ initial }: AthleteProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    heightCm: initial.heightCm?.toString() ?? '',
    weightKg: initial.weightKg?.toString() ?? '',
    fitnessGoal: initial.fitnessGoal ?? '',
    trainingLevel: initial.trainingLevel ?? '',
    activityLevel: initial.activityLevel ?? '',
    trainingHistory: initial.trainingHistory ?? '',
    injuries: initial.injuries ?? '',
    illnesses: initial.illnesses ?? '',
    medications: initial.medications ?? '',
    allergies: initial.allergies ?? '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await api.patch('/athletes/me/profile', {
        ...form,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        fitnessGoal: form.fitnessGoal || undefined,
        trainingLevel: form.trainingLevel || undefined,
        activityLevel: form.activityLevel || undefined,
      });
      setMessage('پروفایل ورزشی با موفقیت به‌روزرسانی شد.');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ذخیره اطلاعات انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  const textareaClass = 'min-h-24 rounded-xl border border-border/10 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent/50';
  const selectClass = 'h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink';

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Input label="قد (سانتی‌متر)" type="number" min="50" max="260" value={form.heightCm} onChange={(event) => update('heightCm', event.target.value)} />
      <Input label="وزن فعلی (کیلوگرم)" type="number" min="20" max="400" step="0.1" value={form.weightKg} onChange={(event) => update('weightKg', event.target.value)} />
      <label className="flex flex-col gap-1.5 text-sm text-muted">
        هدف اصلی
        <select className={selectClass} value={form.fitnessGoal} onChange={(event) => update('fitnessGoal', event.target.value)}>
          <option value="">انتخاب کنید</option><option value="FAT_LOSS">کاهش چربی</option><option value="MUSCLE_GAIN">عضله‌سازی</option><option value="GENERAL_FITNESS">تناسب اندام</option><option value="ENDURANCE">استقامت</option><option value="REHABILITATION">بازتوانی</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-muted">
        سطح تمرین
        <select className={selectClass} value={form.trainingLevel} onChange={(event) => update('trainingLevel', event.target.value)}>
          <option value="">انتخاب کنید</option><option value="BEGINNER">مبتدی</option><option value="INTERMEDIATE">متوسط</option><option value="ADVANCED">پیشرفته</option><option value="ATHLETE">ورزشکار حرفه‌ای</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">
        سطح فعالیت روزانه
        <select className={selectClass} value={form.activityLevel} onChange={(event) => update('activityLevel', event.target.value)}>
          <option value="">انتخاب کنید</option><option value="sedentary">کم‌تحرک</option><option value="light">فعالیت سبک</option><option value="moderate">فعالیت متوسط</option><option value="very_active">بسیار فعال</option>
        </select>
      </label>
      {[
        ['trainingHistory', 'سابقه تمرینی'], ['injuries', 'آسیب‌دیدگی‌ها'], ['illnesses', 'بیماری‌ها'], ['medications', 'داروهای مصرفی'], ['allergies', 'حساسیت‌ها'],
      ].map(([key, label]) => (
        <label key={key} className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">
          {label}
          <textarea className={textareaClass} value={form[key as keyof typeof form]} onChange={(event) => update(key as keyof typeof form, event.target.value)} />
        </label>
      ))}
      {message && <p className="text-sm text-success sm:col-span-2">{message}</p>}
      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={loading} className="sm:col-span-2 sm:w-fit">{loading ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</Button>
    </form>
  );
}

