'use client';

import { useState } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { MembershipCard } from './membership-card';
import { api, ApiError } from '../../lib/api';

interface TrainerApplication {
  id: string;
  bio: string | null;
  specialties: string[];
  certificateUrl: string;
  user: { firstName: string; lastName: string; mobile: string };
}

export function PendingTrainersList({ initial }: { initial: TrainerApplication[] }) {
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    setBusyId(id);
    setError(null);
    try {
      await api.patch(`/trainers/${id}/review`, { status });
      setItems((list) => list.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطایی رخ داد.');
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <MembershipCard className="text-center text-muted">
        هیچ درخواست در انتظار تاییدی وجود ندارد.
      </MembershipCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-danger">{error}</p>}
      {items.map((t) => (
        <MembershipCard key={t.id} className="flex items-center justify-between">
          <div>
            <p className="font-bold">{t.user.firstName} {t.user.lastName}</p>
            <p className="text-sm text-muted">{t.user.mobile}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.specialties.map((s) => (
                <Badge key={s} tone="muted">{s}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={busyId === t.id} onClick={() => review(t.id, 'REJECTED')}>
              رد
            </Button>
            <Button size="sm" disabled={busyId === t.id} onClick={() => review(t.id, 'APPROVED')}>
              تایید
            </Button>
          </div>
        </MembershipCard>
      ))}
    </div>
  );
}
