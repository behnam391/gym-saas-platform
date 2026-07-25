'use client';

import { useState } from 'react';
import { CheckCircle2, KeyRound, PlugZap } from 'lucide-react';
import { api } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';
import { Button } from './button';

interface Integration { id: string; key: string; label: string; category: string; provider?: string | null; status: string; baseUrl?: string | null; requiredEnvVars: string[]; notes?: string | null; lastCheckedAt?: string | null; }
const STATUS: Record<string, { label: string; tone: 'muted' | 'warning' | 'success' | 'danger' }> = { NOT_CONFIGURED: { label: 'نیازمند تنظیم', tone: 'muted' }, CONFIGURED: { label: 'تنظیم‌شده', tone: 'warning' }, HEALTHY: { label: 'سالم', tone: 'success' }, DEGRADED: { label: 'اختلال', tone: 'danger' }, DISABLED: { label: 'غیرفعال', tone: 'muted' } };

export function PlatformIntegrationsPanel({ initial }: { initial: Integration[] }) {
  const [items, setItems] = useState(initial);
  async function update(item: Integration, status: string) { const changed = await api.patch<Integration>(`/super-admin/integrations/${item.key}`, { status, provider: item.provider || undefined, baseUrl: item.baseUrl || undefined, notes: item.notes || undefined }); setItems((current) => current.map((value) => value.id === changed.id ? changed : value)); }
  return <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => { const status = STATUS[item.status] ?? STATUS.NOT_CONFIGURED; return <MembershipCard key={item.id}><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><PlugZap className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-extrabold">{item.label}</p><Badge tone={status.tone}>{status.label}</Badge></div><p className="mt-1 text-sm text-muted">{item.provider || 'ارائه‌دهنده هنوز انتخاب نشده'} · {item.category}</p></div></div><div className="mt-4 rounded-xl bg-surface-raised p-3"><p className="mb-2 flex items-center gap-2 text-xs font-bold"><KeyRound className="size-3.5" />متغیرهای امن مورد نیاز</p><div dir="ltr" className="flex flex-wrap justify-end gap-2">{item.requiredEnvVars.map((name) => <code key={name} className="rounded-lg bg-base px-2 py-1 text-[11px]">{name}</code>)}</div></div><div className="mt-4 flex flex-wrap gap-2">{item.status === 'NOT_CONFIGURED' || item.status === 'DISABLED' ? <Button size="sm" variant="secondary" onClick={() => update(item, 'CONFIGURED')}>ثبت آماده‌سازی</Button> : <Button size="sm" onClick={() => update(item, 'HEALTHY')}><CheckCircle2 className="size-3.5" />تایید سلامت</Button>}<Button size="sm" variant="ghost" onClick={() => update(item, 'DISABLED')}>غیرفعال</Button></div></MembershipCard>; })}</div>;
}
