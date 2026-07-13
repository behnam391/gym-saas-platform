'use client';

import { useState } from 'react';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';
import { api, ApiError } from '../../lib/api';

interface TicketItem {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'باز', IN_PROGRESS: 'در حال بررسی', RESOLVED: 'حل‌شده', CLOSED: 'بسته‌شده',
};
const PRIORITY_TONE: Record<string, 'muted' | 'warning' | 'danger'> = {
  LOW: 'muted', MEDIUM: 'muted', HIGH: 'warning', CRITICAL: 'danger',
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'بالا', CRITICAL: 'بحرانی',
};

export function TicketsPanel({ initial }: { initial: TicketItem[] }) {
  const [tickets, setTickets] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function advance(id: string, status: TicketItem['status']) {
    setBusyId(id);
    try {
      const token = sessionStorage.getItem('accessToken') ?? undefined;
      await api.patch(`/tickets/${id}`, { status }, { accessToken: token });
      setTickets((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch {
      // surfaced via toast in a fuller implementation
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {tickets.map((t) => (
        <MembershipCard key={t.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{t.subject}</p>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
              <Badge tone="accent">{STATUS_LABEL[t.status]}</Badge>
            </div>
          </div>
          {t.status !== 'CLOSED' && (
            <div className="mt-4 flex gap-2 text-xs">
              {t.status === 'OPEN' && (
                <button
                  disabled={busyId === t.id}
                  onClick={() => advance(t.id, 'IN_PROGRESS')}
                  className="text-accent-soft hover:underline"
                >
                  شروع بررسی
                </button>
              )}
              {t.status !== 'RESOLVED' && (
                <button
                  disabled={busyId === t.id}
                  onClick={() => advance(t.id, 'RESOLVED')}
                  className="text-success hover:underline"
                >
                  علامت‌گذاری به‌عنوان حل‌شده
                </button>
              )}
            </div>
          )}
        </MembershipCard>
      ))}
    </div>
  );
}
