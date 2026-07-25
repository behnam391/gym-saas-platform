'use client';

import { FormEvent, useState } from 'react';
import { CalendarDays, Edit3, Plus, Power, WalletCards } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface ManagedMembershipPlan {
  id: string;
  title: string;
  description?: string | null;
  durationDays: number;
  price: number | string;
  isActive: boolean;
}

const EMPTY_FORM = { title: '', description: '', durationDays: '30', price: '' };

export function MembershipPlansManager({ initial }: { initial: ManagedMembershipPlan[] }) {
  const [plans, setPlans] = useState(initial);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function beginCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  }

  function beginEdit(plan: ManagedMembershipPlan) {
    setEditingId(plan.id);
    setForm({ title: plan.title, description: plan.description ?? '', durationDays: String(plan.durationDays), price: String(plan.price) });
    setShowForm(true);
    setError('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusyId(editingId ?? 'new');
    setError('');
    const payload = { title: form.title.trim(), description: form.description.trim() || undefined, durationDays: Number(form.durationDays), price: Number(form.price) };
    try {
      if (editingId) {
        const updated = await api.patch<ManagedMembershipPlan>(`/tenants/me/membership-plans/${editingId}`, payload);
        setPlans((items) => items.map((item) => item.id === editingId ? updated : item));
      } else {
        const created = await api.post<ManagedMembershipPlan>('/tenants/me/membership-plans', payload);
        setPlans((items) => [created, ...items]);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ذخیره پلن انجام نشد.');
    } finally { setBusyId(null); }
  }

  async function toggle(plan: ManagedMembershipPlan) {
    setBusyId(plan.id);
    setError('');
    try {
      const updated = plan.isActive
        ? await api.delete<ManagedMembershipPlan>(`/tenants/me/membership-plans/${plan.id}`)
        : await api.patch<ManagedMembershipPlan>(`/tenants/me/membership-plans/${plan.id}`, { isActive: true });
      setPlans((items) => items.map((item) => item.id === plan.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت پلن انجام نشد.');
    } finally { setBusyId(null); }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end"><Button onClick={beginCreate}><Plus className="size-4" />پلن جدید</Button></div>
      {showForm && (
        <MembershipCard>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Input label="عنوان پلن" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <Input label="مدت عضویت (روز)" type="number" min="1" value={form.durationDays} onChange={(event) => setForm({ ...form, durationDays: event.target.value })} required />
            <Input label="قیمت (تومان)" type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
            <Input label="توضیحات" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            {error && <p className="sm:col-span-2 text-sm text-danger">{error}</p>}
            <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busyId !== null}>{editingId ? 'ذخیره تغییرات' : 'ایجاد پلن'}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>انصراف</Button></div>
          </form>
        </MembershipCard>
      )}

      {!plans.length ? (
        <MembershipCard className="text-center text-muted"><WalletCards className="mx-auto mb-3 size-9" />هنوز پلن عضویتی ساخته نشده است.</MembershipCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <MembershipCard key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">{plan.title}</h2><p className="mt-1 text-sm text-muted">{plan.description || 'پلن عضویت باشگاه'}</p></div><Badge tone={plan.isActive ? 'success' : 'muted'}>{plan.isActive ? 'فعال' : 'بایگانی'}</Badge></div>
              <p className="mt-6 text-2xl font-extrabold text-accent-soft">{Number(plan.price).toLocaleString('fa-IR')} <span className="text-xs font-normal text-muted">تومان</span></p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted"><CalendarDays className="size-4" />{plan.durationDays.toLocaleString('fa-IR')} روز</p>
              <div className="mt-5 flex gap-2 border-t border-white/10 pt-4"><Button size="sm" variant="secondary" onClick={() => beginEdit(plan)}><Edit3 className="size-3.5" />ویرایش</Button><Button size="sm" variant="secondary" disabled={busyId === plan.id} onClick={() => toggle(plan)}><Power className="size-3.5" />{plan.isActive ? 'بایگانی' : 'فعال‌سازی'}</Button></div>
            </MembershipCard>
          ))}
        </div>
      )}
    </div>
  );
}
