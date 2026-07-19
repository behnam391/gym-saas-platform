'use client';

import { useState } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { api, ApiError } from '../../lib/api';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  isMinor: boolean;
  isRestricted: boolean;
}

export function MembersTable({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approveConsent(userId: string) {
    setBusyId(userId);
    setError(null);
    try {
      await api.patch(`/tenants/me/parental-consent/${userId}`, { status: 'APPROVED' });
      setMembers((m) => m.map((x) => (x.id === userId ? { ...x, isRestricted: false } : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطایی رخ داد.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-border/10">
      {error && <p className="bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}
      <table className="w-full text-right text-sm">
        <thead className="bg-surface-raised text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">نام</th>
            <th className="px-4 py-3 font-medium">موبایل</th>
            <th className="px-4 py-3 font-medium">وضعیت</th>
            <th className="px-4 py-3 font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-t border-border/10">
              <td className="px-4 py-3">{m.firstName} {m.lastName}</td>
              <td className="px-4 py-3 text-muted">{m.mobile}</td>
              <td className="px-4 py-3">
                {m.isRestricted ? (
                  <Badge tone="warning">منتظر تایید رضایت‌نامه</Badge>
                ) : m.isMinor ? (
                  <Badge tone="success">خردسال — تایید‌شده</Badge>
                ) : (
                  <Badge tone="success">فعال</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                {m.isRestricted && (
                  <Button size="sm" disabled={busyId === m.id} onClick={() => approveConsent(m.id)}>
                    {busyId === m.id ? 'در حال تایید…' : 'تایید رضایت‌نامه'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
