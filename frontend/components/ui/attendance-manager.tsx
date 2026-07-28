'use client';

import { FormEvent, useCallback, useMemo, useState } from 'react';
import { LogIn, LogOut, UserCheck, UserPlus } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { AttendancePassScanner } from './attendance-pass-scanner';
import { Badge } from './badge';
import { Button } from './button';
import { MembershipCard } from './membership-card';

interface AttendanceMember {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  memberships?: Array<{ id: string; status: string; plan: { title: string } }>;
}

export interface AttendanceRecord {
  id: string;
  checkInAt: string;
  checkOutAt?: string | null;
  method: string;
  user: { id: string; firstName: string; lastName: string; mobile: string };
  membership?: { plan: { title: string } } | null;
}

export function AttendanceManager({
  initialRecords,
  members,
}: {
  initialRecords: AttendanceRecord[];
  members: AttendanceMember[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [userId, setUserId] = useState('');
  const [method, setMethod] = useState('MANUAL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const activeCount = useMemo(
    () => records.filter((item) => !item.checkOutAt).length,
    [records],
  );

  const refreshRecords = useCallback(async () => {
    const latest = await api.get<AttendanceRecord[]>('/attendance/recent');
    setRecords(latest);
  }, []);

  async function checkIn(event: FormEvent) {
    event.preventDefault();
    const member = members.find((item) => item.id === userId);
    if (!member) return;
    const memberships = member.memberships ?? [];
    const membership =
      memberships.find((item) => item.status === 'ACTIVE') ?? memberships[0];
    setBusyId('check-in');
    setError('');
    try {
      const created = await api.post<Omit<AttendanceRecord, 'user' | 'membership'>>(
        '/attendance/check-in',
        { userId, method, membershipId: membership?.id },
      );
      setRecords((items) => [
        {
          ...created,
          user: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            mobile: member.mobile,
          },
          membership: membership ? { plan: membership.plan } : null,
        },
        ...items,
      ]);
      setUserId('');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت ورود انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  async function checkOut(record: AttendanceRecord) {
    setBusyId(record.id);
    setError('');
    try {
      const updated = await api.post<AttendanceRecord>(`/attendance/check-out/${record.id}`);
      setRecords((items) =>
        items.map((item) =>
          item.id === record.id ? { ...item, checkOutAt: updated.checkOutAt } : item,
        ),
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت خروج انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AttendancePassScanner onAttendanceChanged={refreshRecords} />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <MembershipCard>
          <h2 className="flex items-center gap-2 font-bold">
            <UserPlus className="size-5 text-accent-soft" />
            ثبت دستی حضور
          </h2>
          <p className="mt-1 text-sm text-muted">
            برای مواقع اضطراری یا اعضایی که به اپ دسترسی ندارند.
          </p>
          <form onSubmit={checkIn} className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted">انتخاب عضو</span>
              <select
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                required
                className="h-11 rounded-xl border border-white/10 bg-surface px-3"
              >
                <option value="">یک عضو را انتخاب کنید</option>
                {members.map((member) => {
                  const canEnter = (member.memberships ?? []).some(
                    (membership) => membership.status === 'ACTIVE',
                  );
                  return (
                    <option key={member.id} value={member.id} disabled={!canEnter}>
                      {member.firstName} {member.lastName} · {member.mobile}
                      {canEnter ? '' : ' · عضویت غیرفعال'}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted">روش ورود</span>
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-surface px-3"
              >
                <option value="MANUAL">ثبت دستی</option>
                <option value="MEMBERSHIP_CARD">کارت عضویت</option>
              </select>
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={!userId || busyId !== null}>
              <LogIn className="size-4" />
              ثبت ورود
            </Button>
          </form>
        </MembershipCard>

        <MembershipCard className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">حاضرین فعلی باشگاه</p>
            <p className="mt-2 text-4xl font-extrabold">{activeCount.toLocaleString('fa-IR')}</p>
            <p className="mt-1 text-xs text-muted">از ظرفیت ۸۰ نفر</p>
          </div>
          <UserCheck className="size-14 text-accent-soft" />
        </MembershipCard>
      </div>

      <MembershipCard className="overflow-hidden p-0">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-bold">آخرین ورود و خروج‌ها</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-surface-raised text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">عضو</th>
                <th className="px-5 py-3 font-medium">پلن</th>
                <th className="px-5 py-3 font-medium">ورود</th>
                <th className="px-5 py-3 font-medium">خروج</th>
                <th className="px-5 py-3 font-medium">وضعیت</th>
                <th className="px-5 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-white/10">
                  <td className="px-5 py-4">
                    <p className="font-bold">
                      {record.user.firstName} {record.user.lastName}
                    </p>
                    <p className="text-xs text-muted">{record.user.mobile}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {record.membership?.plan.title ?? '—'}
                  </td>
                  <td className="px-5 py-4">
                    {new Date(record.checkInAt).toLocaleString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {record.checkOutAt
                      ? new Date(record.checkOutAt).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={record.checkOutAt ? 'muted' : 'success'}>
                      {record.checkOutAt ? 'خارج‌شده' : 'حاضر'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    {!record.checkOutAt && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === record.id}
                        onClick={() => checkOut(record)}
                      >
                        <LogOut className="size-3.5" />
                        ثبت خروج
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    هنوز ورود یا خروجی ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </MembershipCard>
    </div>
  );
}
