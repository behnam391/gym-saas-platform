'use client';

import { useState } from 'react';
import { Clock3, PackageCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';

interface Order { id: string; status: string; totalAmount: number; createdAt: string; user: { firstName: string; lastName: string; mobile: string }; items: { id: string; quantity: number; product: { title: string } }[]; }
const STATUS: Record<string, { label: string; tone: 'warning' | 'accent' | 'success' | 'muted' | 'danger' }> = { PLACED: { label: 'جدید', tone: 'warning' }, PREPARING: { label: 'در حال آماده‌سازی', tone: 'accent' }, READY: { label: 'آماده تحویل', tone: 'success' }, DELIVERED: { label: 'تحویل‌شده', tone: 'muted' }, CANCELLED: { label: 'لغوشده', tone: 'danger' } };

export function BuffetOrdersPanel({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  async function update(id: string, status: string) { const changed = await api.patch<Order>(`/cafeteria/orders/${id}/status`, { status }); setOrders((current) => current.map((item) => item.id === id ? { ...item, status: changed.status } : item)); }
  return <div className="grid gap-4 lg:grid-cols-2">{orders.length === 0 && <MembershipCard className="text-center text-muted lg:col-span-2">سفارش فعالی وجود ندارد.</MembershipCard>}{orders.map((order) => { const state = STATUS[order.status] ?? STATUS.PLACED; return <MembershipCard key={order.id}><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{order.user.firstName} {order.user.lastName}</p><p className="mt-1 text-xs text-muted">{order.user.mobile} · {new Date(order.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p></div><Badge tone={state.tone}>{state.label}</Badge></div><div className="my-4 space-y-2 rounded-xl bg-surface-raised p-3">{order.items.map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.product.title}</span><strong>{item.quantity.toLocaleString('fa-IR')} عدد</strong></div>)}</div><div className="flex flex-wrap items-center gap-2"><strong className="ml-auto text-accent-soft">{Number(order.totalAmount).toLocaleString('fa-IR')} تومان</strong>{order.status === 'PLACED' && <button onClick={() => update(order.id, 'PREPARING')} className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-base"><Clock3 className="size-3.5" />شروع آماده‌سازی</button>}{order.status === 'PREPARING' && <button onClick={() => update(order.id, 'READY')} className="inline-flex items-center gap-1 rounded-xl bg-success px-3 py-2 text-xs font-bold text-base"><PackageCheck className="size-3.5" />آماده شد</button>}{order.status === 'READY' && <button onClick={() => update(order.id, 'DELIVERED')} className="rounded-xl bg-surface-raised px-3 py-2 text-xs font-bold">تحویل سفارش</button>}</div></MembershipCard>; })}</div>;
}
