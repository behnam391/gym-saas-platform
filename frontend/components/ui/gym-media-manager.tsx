'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, Star, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Button } from './button';

interface GalleryImage { id: string; url: string; type: string; sortOrder: number; }

export function GymMediaManager({ initial }: { initial: GalleryImage[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      const added: GalleryImage[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData(); form.append('purpose', 'GYM_GALLERY'); form.append('file', file);
        const response = await fetch('/api/backend/uploads/local', { method: 'POST', body: form });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? 'آپلود تصویر انجام نشد.');
        added.push(await api.post<GalleryImage>('/tenants/me/gallery', { url: payload.url, type: 'image' }));
      }
      setImages((current) => [...current, ...added]); setMessage(`${added.length.toLocaleString('fa-IR')} تصویر به گالری افزوده شد.`);
    } catch (err) { setError(err instanceof Error ? err.message : 'آپلود انجام نشد.'); }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = ''; }
  }

  async function remove(id: string) {
    await api.delete(`/tenants/me/gallery/${id}`); setImages((current) => current.filter((item) => item.id !== id));
  }

  async function makeCover(url: string) {
    await api.patch('/tenants/me/profile', { coverImageUrl: url }); setMessage('تصویر کاور باشگاه تغییر کرد.');
  }

  async function makeLogo(url: string) {
    await api.patch('/tenants/me/profile', { logoUrl: url }); setMessage('نشان باشگاه تغییر کرد.');
  }

  return (
    <div className="flex flex-col gap-5">
      <MembershipCard className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="font-extrabold">گالری عمومی باشگاه</h2><p className="mt-1 text-sm text-muted">چند تصویر واقعی از محیط، دستگاه‌ها و کلاس‌ها انتخاب کنید.</p></div>
        <input ref={inputRef} hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files)} />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={loading}><ImagePlus className="size-4" />{loading ? 'در حال آپلود…' : 'افزودن تصاویر'}</Button>
        {message && <p className="w-full text-sm text-success">{message}</p>}{error && <p className="w-full text-sm text-danger">{error}</p>}
      </MembershipCard>
      {images.length === 0 ? <MembershipCard className="grid min-h-52 place-items-center text-center text-muted"><div><Camera className="mx-auto mb-3 size-8" /><p>هنوز تصویری ثبت نشده است.</p></div></MembershipCard> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{images.map((image) => <MembershipCard key={image.id} className="overflow-hidden p-0"><img src={image.url} alt="تصویر باشگاه" className="h-44 w-full object-cover" /><div className="flex flex-wrap gap-2 p-3"><Button size="sm" variant="secondary" onClick={() => makeCover(image.url)}><Star className="size-3.5" />کاور</Button><Button size="sm" variant="ghost" onClick={() => makeLogo(image.url)}>نشان</Button><Button size="sm" variant="ghost" onClick={() => remove(image.id)} className="mr-auto text-danger"><Trash2 className="size-3.5" /></Button></div></MembershipCard>)}</div>}
    </div>
  );
}
