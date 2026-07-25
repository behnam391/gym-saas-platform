'use client';

import { useMemo, useState } from 'react';
import { Search, ShieldAlert, UserCheck, UsersRound } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  role: string;
  isActive: boolean;
  isRestricted: boolean;
  createdAt: string;
  tenant?: { id: string; name: string; city: string } | null;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'مدیر ارشد',
  GYM_OWNER: 'صاحب باشگاه',
  TRAINER: 'مربی',
  NUTRITIONIST: 'متخصص تغذیه',
  RECEPTION: 'پذیرش',
  BUFFET_STAFF: 'بوفه‌دار',
  ATHLETE: 'ورزشکار',
};

export function PlatformUsersManager({ initialUsers }: { initialUsers: PlatformUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [access, setAccess] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'RESTRICTED'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const value = search.trim().toLocaleLowerCase('fa-IR');
    return users.filter((user) => {
      const matchesSearch = !value || [`${user.firstName} ${user.lastName}`, user.firstName, user.lastName, user.mobile, user.email, user.tenant?.name]
        .filter(Boolean).some((item) => String(item).toLocaleLowerCase('fa-IR').includes(value));
      const matchesRole = role === 'ALL' || user.role === role;
      const matchesAccess = access === 'ALL'
        || (access === 'ACTIVE' && user.isActive)
        || (access === 'INACTIVE' && !user.isActive)
        || (access === 'RESTRICTED' && user.isRestricted);
      return matchesSearch && matchesRole && matchesAccess;
    });
  }, [access, role, search, users]);

  async function updateAccess(user: PlatformUser, changes: Partial<Pick<PlatformUser, 'isActive' | 'isRestricted'>>) {
    setBusyId(user.id); setError(null);
    try {
      const changed = await api.patch<PlatformUser>(`/super-admin/users/${user.id}/access`, changes);
      setUsers((items) => items.map((item) => item.id === user.id ? changed : item));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر دسترسی کاربر انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = users.filter((user) => user.isActive).length;
  const restrictedCount = users.filter((user) => user.isRestricted).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'کل کاربران', value: users.length, icon: UsersRound, tone: 'text-accent-soft bg-accent/10' },
          { label: 'کاربران فعال', value: activeCount, icon: UserCheck, tone: 'text-success bg-success/10' },
          { label: 'دسترسی محدود', value: restrictedCount, icon: ShieldAlert, tone: 'text-warning bg-warning/10' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <MembershipCard key={label} className="flex items-center justify-between">
            <div><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold">{value.toLocaleString('fa-IR')}</p></div>
            <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></span>
          </MembershipCard>
        ))}
      </div>

      <MembershipCard className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-3.5 size-4 text-muted" />
          <Input aria-label="جست‌وجوی کاربر" className="pr-11" placeholder="نام، موبایل، ایمیل یا باشگاه..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select aria-label="فیلتر نقش" className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-sm" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="ALL">همه نقش‌ها</option>{Object.entries(ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="فیلتر دسترسی" className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-sm" value={access} onChange={(event) => setAccess(event.target.value as typeof access)}>
          <option value="ALL">همه دسترسی‌ها</option><option value="ACTIVE">فعال</option><option value="INACTIVE">غیرفعال</option><option value="RESTRICTED">محدود</option>
        </select>
      </MembershipCard>

      {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="overflow-hidden rounded-card border border-border/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead className="bg-surface-raised text-muted"><tr><th className="px-4 py-3 font-medium">کاربر</th><th className="px-4 py-3 font-medium">نقش</th><th className="px-4 py-3 font-medium">باشگاه</th><th className="px-4 py-3 font-medium">وضعیت دسترسی</th><th className="px-4 py-3 font-medium">عضویت در سامانه</th><th className="px-4 py-3 font-medium">عملیات</th></tr></thead>
            <tbody>{visible.map((user) => {
              const protectedUser = user.role === 'SUPER_ADMIN';
              return (
                <tr key={user.id} className="border-t border-border/10">
                  <td className="px-4 py-4"><p className="font-bold">{user.firstName} {user.lastName}</p><p className="mt-1 text-xs text-muted">{user.mobile}{user.email ? ` · ${user.email}` : ''}</p></td>
                  <td className="px-4 py-4"><Badge tone={user.role === 'SUPER_ADMIN' ? 'accent' : 'muted'}>{ROLE_LABEL[user.role] ?? user.role}</Badge></td>
                  <td className="px-4 py-4"><p>{user.tenant?.name ?? 'مدیریت پلتفرم'}</p>{user.tenant?.city && <p className="mt-1 text-xs text-muted">{user.tenant.city}</p>}</td>
                  <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'فعال' : 'غیرفعال'}</Badge>{user.isRestricted && <Badge tone="warning">محدود</Badge>}</div></td>
                  <td className="px-4 py-4 text-muted">{new Date(user.createdAt).toLocaleDateString('fa-IR')}</td>
                  <td className="px-4 py-4">{protectedUser ? <span className="text-xs text-muted">حساب محافظت‌شده</span> : <div className="flex flex-wrap gap-2"><Button size="sm" variant={user.isActive ? 'danger' : 'primary'} disabled={busyId === user.id} onClick={() => updateAccess(user, { isActive: !user.isActive })}>{user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</Button><Button size="sm" variant="secondary" disabled={busyId === user.id} onClick={() => updateAccess(user, { isRestricted: !user.isRestricted })}>{user.isRestricted ? 'رفع محدودیت' : 'محدودسازی'}</Button></div>}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        {!visible.length && <p className="px-4 py-10 text-center text-sm text-muted">کاربری با این فیلتر پیدا نشد.</p>}
      </div>
    </div>
  );
}
