'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { MembershipCard } from './membership-card';
import { CrowdBadge } from './crowd-badge';
import { api } from '../../lib/api';

interface CrowdStatus {
  activeCount: number;
  capacity: number;
  level: string;
}

/**
 * Polling fallback shown here for clarity; production should subscribe to
 * the `crowd-update` event on the CrowdGateway WebSocket (see backend
 * `attendance/crowd.gateway.ts`) instead of polling every 30s.
 */
export function CrowdStatusWidget() {
  const [status, setStatus] = useState<CrowdStatus | null>(null);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const data = await api.get<CrowdStatus>('/attendance/crowd-status');
        if (mounted) setStatus(data);
      } catch {
        // silently retry on next interval
      }
    }

    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <MembershipCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Users className="size-4" />
          وضعیت شلوغی الان
        </div>
        {status ? <CrowdBadge level={status.level} /> : <span className="text-xs text-muted">در حال بارگذاری…</span>}
      </div>
      {status && (
        <p className="mt-3 text-2xl font-extrabold">
          {status.activeCount}
          <span className="mr-1 text-sm font-normal text-muted"> / {status.capacity} نفر حاضر</span>
        </p>
      )}
    </MembershipCard>
  );
}
