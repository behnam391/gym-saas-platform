'use client';

import { useState } from 'react';
import { CreditCard, Landmark, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';

interface FinancialAccount { id: string; scope: string; label: string; bankName?: string | null; accountHolder: string; iban?: string | null; accountNumber?: string | null; cardLast4?: string | null; isDefault: boolean; isVerified: boolean; }
const SCOPE_LABELS: Record<string, string> = { PERSONAL: 'شخصی', GYM: 'باشگاه', BUFFET: 'بوفه', TRAINER: 'مربی', ADVISOR: 'مشاور' };

export function FinancialAccountsPanel({ initial, scopes }: { initial: FinancialAccount[]; scopes: string[] }) {
  const [accounts, setAccounts] = useState(initial);
  const [form, setForm] = useState({ scope: scopes[0] ?? 'PERSONAL', label: '', bankName: '', accountHolder: '', iban: '', accountNumber: '', cardNumber: '', isDefault: true });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    try {
      const created = await api.post<FinancialAccount>('/financial-accounts', { ...form, iban: form.iban || undefined, accountNumber: form.accountNumber || undefined, cardNumber: form.cardNumber || undefined });
      setAccounts((current) => [created, ...current.map((item) => form.isDefault ? { ...item, isDefault: false } : item)]);
      setForm({ ...form, label: '', bankName: '', accountHolder: '', iban: '', accountNumber: '', cardNumber: '' });
    } catch (err) { setError(err instanceof ApiError ? err.message : 'ثبت حساب انجام نشد.'); }
    finally { setLoading(false); }
  }

  async function remove(id: string) {
    await api.delete(`/financial-accounts/${id}`);
    setAccounts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
      <MembershipCard>
        <h2 className="mb-1 font-extrabold">افزودن حساب تسویه</h2>
        <p className="mb-5 text-xs leading-5 text-muted">شماره کامل کارت ذخیره نمی‌شود؛ فقط چهار رقم پایانی برای شناسایی نگهداری خواهد شد.</p>
        <form onSubmit={create} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm text-muted">کاربرد<select className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}>{scopes.map((scope) => <option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>)}</select></label>
          <Input label="عنوان حساب" placeholder="مثلاً حساب تسویه اصلی" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} required />
          <Input label="نام صاحب حساب" value={form.accountHolder} onChange={(event) => setForm({ ...form, accountHolder: event.target.value })} required />
          <Input label="نام بانک" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} />
          <Input label="شماره شبا" dir="ltr" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx" value={form.iban} onChange={(event) => setForm({ ...form, iban: event.target.value.toUpperCase().replace(/\s/g, '') })} />
          <Input label="شماره حساب" dir="ltr" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} />
          <Input label="شماره کارت ۱۶ رقمی" dir="ltr" maxLength={16} value={form.cardNumber} onChange={(event) => setForm({ ...form, cardNumber: event.target.value.replace(/\D/g, '') })} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'در حال ثبت…' : 'ثبت حساب'}</Button>
        </form>
      </MembershipCard>
      <div className="flex flex-col gap-3">
        {accounts.length === 0 && <MembershipCard className="text-center text-muted">هنوز حسابی ثبت نشده است.</MembershipCard>}
        {accounts.map((account) => <MembershipCard key={account.id} className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Landmark className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{account.label}</p><Badge tone="muted">{SCOPE_LABELS[account.scope]}</Badge>{account.isDefault && <Badge tone="accent">پیش‌فرض</Badge>}</div><p className="mt-1 text-sm text-muted">{account.accountHolder}{account.bankName ? ` · ${account.bankName}` : ''}</p>{account.iban && <p dir="ltr" className="mt-3 overflow-hidden text-ellipsis rounded-lg bg-surface-raised px-3 py-2 text-left text-xs">{account.iban}</p>}{account.cardLast4 && <p className="mt-2 flex items-center gap-2 text-xs text-muted"><CreditCard className="size-3.5" /> کارت منتهی به {account.cardLast4}</p>}</div><button type="button" onClick={() => remove(account.id)} className="text-muted hover:text-danger" aria-label="حذف حساب"><Trash2 className="size-4" /></button></MembershipCard>)}
      </div>
    </div>
  );
}
