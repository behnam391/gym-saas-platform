'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../lib/api';
import { MembershipCard } from './membership-card';

export interface NotificationItem { id: string; title: string; body: string; isRead: boolean; channel: string; createdAt: string }

export function NotificationsPanel({ initial }: { initial: NotificationItem[] }) {
  const [items, setItems] = useState(initial);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`).catch(() => null);
    setItems((list) => list.map((item) => item.id === id ? { ...item, isRead: true } : item));
  }

  if (!items.length) return <MembershipCard className="text-center text-muted"><Bell className="mx-auto mb-3 size-9" />اعلان تازه‌ای ندارید.</MembershipCard>;
  return (
    <MembershipCard className="overflow-hidden p-0">
      <div className="divide-y divide-white/10">
        {items.map((item) => (
          <button key={item.id} onClick={() => !item.isRead && markRead(item.id)} className={`flex w-full items-start gap-4 p-5 text-right transition hover:bg-white/5 ${item.isRead ? 'opacity-65' : ''}`}>
            <span className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl ${item.isRead ? 'bg-surface-raised text-muted' : 'bg-accent/15 text-accent-soft'}`}>{item.isRead ? <CheckCheck className="size-5" /> : <Bell className="size-5" />}</span>
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><strong>{item.title}</strong><span className="text-xs text-muted">{new Date(item.createdAt).toLocaleDateString('fa-IR-u-ca-persian')}</span></span><span className="mt-1 block text-sm leading-6 text-muted">{item.body}</span></span>
            {!item.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />}
          </button>
        ))}
      </div>
    </MembershipCard>
  );
}
