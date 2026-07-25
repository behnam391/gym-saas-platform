'use client';

import { FormEvent, useRef, useState } from 'react';
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';
import { HeroSlide } from './public-hero-slider';

export interface AdminHeroSlide extends HeroSlide {
  isActive: boolean;
  sortOrder: number;
}

const EMPTY = {
  eyebrow: '',
  title: '',
  subtitle: '',
  imageUrl: '',
  imageCredit: '',
  ctaLabel: '',
  ctaUrl: '/access/athlete',
  isActive: true,
  sortOrder: 0,
};

export function HeroSlidesManager({ initial }: { initial: AdminHeroSlide[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function edit(item: AdminHeroSlide) {
    setEditingId(item.id);
    setForm({
      eyebrow: item.eyebrow ?? '',
      title: item.title,
      subtitle: item.subtitle ?? '',
      imageUrl: item.imageUrl,
      imageCredit: item.imageCredit ?? '',
      ctaLabel: item.ctaLabel ?? '',
      ctaUrl: item.ctaUrl ?? '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setEditingId(null); setForm(EMPTY); setError(null);
  }

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const payload = new FormData();
      payload.append('purpose', 'HERO_SLIDE');
      payload.append('file', file);
      const response = await fetch('/api/backend/uploads/local', { method: 'POST', body: payload });
      const body = await response.json();
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join('، ') : body.message);
      setForm((current) => ({ ...current, imageUrl: body.url, imageCredit: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'آپلود تصویر انجام نشد.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(null);
    const payload = {
      ...form,
      eyebrow: form.eyebrow || undefined,
      subtitle: form.subtitle || undefined,
      imageCredit: form.imageCredit || undefined,
      ctaLabel: form.ctaLabel || undefined,
      ctaUrl: form.ctaUrl || undefined,
      sortOrder: Number(form.sortOrder),
    };
    try {
      if (editingId) {
        const updated = await api.patch<AdminHeroSlide>(`/site-content/admin/hero-slides/${editingId}`, payload);
        setItems((current) => current.map((item) => item.id === editingId ? updated : item).sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        const created = await api.post<AdminHeroSlide>('/site-content/admin/hero-slides', payload);
        setItems((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ذخیره اسلاید انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function toggle(item: AdminHeroSlide) {
    const updated = await api.patch<AdminHeroSlide>(`/site-content/admin/hero-slides/${item.id}`, { isActive: !item.isActive });
    setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
  }

  async function remove(item: AdminHeroSlide) {
    if (!window.confirm(`اسلاید «${item.title}» حذف شود؟`)) return;
    await api.delete(`/site-content/admin/hero-slides/${item.id}`);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    if (editingId === item.id) reset();
  }

  return (
    <div className="space-y-6">
      <MembershipCard>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="flex items-center gap-2 font-extrabold">{editingId ? <Pencil className="size-5 text-accent-soft" /> : <Plus className="size-5 text-accent-soft" />}{editingId ? 'ویرایش اسلاید' : 'اسلاید جدید'}</p><p className="mt-2 text-sm text-muted">تصویر، متن و دکمهٔ صفحه اصلی را بدون تغییر کد مدیریت کنید.</p></div>
          {editingId && <Button type="button" variant="ghost" size="sm" onClick={reset}><X className="size-4" />انصراف</Button>}
        </div>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          <Input label="عنوان کوتاه بالای متن" value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} />
          <Input label="ترتیب نمایش" type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
          <Input label="عنوان اصلی" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="lg:col-span-2" />
          <label className="flex flex-col gap-1.5 text-sm text-muted lg:col-span-2">توضیح اسلاید<textarea value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} rows={3} className="rounded-xl border border-border/10 bg-surface p-4 text-ink focus:outline-none focus:ring-2 focus:ring-accent/50" /></label>
          <div className="lg:col-span-2">
            <div className="mb-2 flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1"><Input label="آدرس تصویر" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://... یا آپلود تصویر" required /></div>
              <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0])} />
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}><ImagePlus className="size-4" />{uploading ? 'در حال آپلود…' : 'آپلود تصویر'}</Button>
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="پیش‌نمایش اسلاید" className="h-48 w-full rounded-2xl object-cover" />}
          </div>
          <Input label="نام عکاس / منبع (اختیاری)" value={form.imageCredit} onChange={(event) => setForm({ ...form, imageCredit: event.target.value })} />
          <Input label="متن دکمه (اختیاری)" value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} />
          <Input label="لینک دکمه (اختیاری)" value={form.ctaUrl} onChange={(event) => setForm({ ...form, ctaUrl: event.target.value })} placeholder="/access/athlete" />
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />نمایش در صفحه اصلی</label>
          {error && <p className="text-sm text-danger lg:col-span-2">{error}</p>}
          <Button type="submit" disabled={loading || uploading} className="lg:col-span-2"><Save className="size-4" />{loading ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'افزودن اسلاید'}</Button>
        </form>
      </MembershipCard>

      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((item) => (
          <MembershipCard key={item.id} className={`overflow-hidden p-0 ${!item.isActive ? 'opacity-65' : ''}`}>
            <div className="relative h-56"><img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><p className="text-xs text-white/70">ترتیب {item.sortOrder.toLocaleString('fa-IR')}</p><h3 className="mt-1 text-xl font-extrabold">{item.title}</h3></div></div>
            <div className="flex flex-wrap gap-2 p-4">
              <Button type="button" size="sm" variant="secondary" onClick={() => edit(item)}><Pencil className="size-4" />ویرایش</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => toggle(item)}>{item.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{item.isActive ? 'پنهان‌کردن' : 'نمایش'}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(item)} className="mr-auto text-danger"><Trash2 className="size-4" />حذف</Button>
            </div>
          </MembershipCard>
        ))}
      </div>
    </div>
  );
}
