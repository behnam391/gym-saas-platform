'use client';

import { useMemo, useState } from 'react';
import { Building2, CheckCircle2, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface PlatformGym {
  id: string;
  name: string;
  slug: string;
  province?: string | null;
  county?: string | null;
  city: string;
  isActive: boolean;
  isVerified: boolean;
  trustScore: number;
  createdAt: string;
  _count: { users: number; memberships: number };
  subscription?: { status: string; renewsAt?: string | null; plan: { code: string; name: string } } | null;
}

export function PlatformGymsManager({ initialGyms }: { initialGyms: PlatformGym[] }) {
  const [gyms, setGyms] = useState(initialGyms);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'UNVERIFIED'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const value = search.trim().toLocaleLowerCase('fa-IR');
    return gyms.filter((gym) => {
      const matchesSearch = !value || [gym.name, gym.slug, gym.province, gym.county, gym.city]
        .filter(Boolean).some((item) => String(item).toLocaleLowerCase('fa-IR').includes(value));
      const matchesStatus = status === 'ALL'
        || (status === 'ACTIVE' && gym.isActive)
        || (status === 'INACTIVE' && !gym.isActive)
        || (status === 'UNVERIFIED' && !gym.isVerified);
      return matchesSearch && matchesStatus;
    });
  }, [gyms, search, status]);

  async function updateGym(gym: PlatformGym, kind: 'verify' | 'active') {
    setBusyId(gym.id); setError(null);
    try {
      const changed = kind === 'verify'
        ? await api.patch<PlatformGym>(`/super-admin/tenants/${gym.id}/verify`, { isVerified: !gym.isVerified })
        : await api.patch<PlatformGym>(`/super-admin/tenants/${gym.id}/active`, { isActive: !gym.isActive });
      setGyms((items) => items.map((item) => item.id === gym.id ? {
        ...item,
        isVerified: changed.isVerified,
        isActive: changed.isActive,
      } : item));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت باشگاه انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = gyms.filter((gym) => gym.isActive).length;
  const verifiedCount = gyms.filter((gym) => gym.isVerified).length;
  const memberCount = gyms.reduce((sum, gym) => sum + gym._count.memberships, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'کل باشگاه‌ها', value: gyms.length, icon: Building2 },
          { label: 'باشگاه فعال', value: activeCount, icon: CheckCircle2 },
          { label: 'تأیید هویت‌شده', value: verifiedCount, icon: ShieldCheck },
          { label: 'عضویت‌های ثبت‌شده', value: memberCount, icon: UsersRound },
        ].map(({ label, value, icon: Icon }) => (
          <MembershipCard key={label} className="flex items-center justify-between">
            <div><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold">{value.toLocaleString('fa-IR')}</p></div>
            <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Icon className="size-5" /></span>
          </MembershipCard>
        ))}
      </div>

      <MembershipCard className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-4 top-3.5 size-4 text-muted" />
          <Input aria-label="جست‌وجوی باشگاه" className="pr-11" placeholder="نام باشگاه، استان یا شهر..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select aria-label="فیلتر وضعیت باشگاه" className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-sm" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="ALL">همه وضعیت‌ها</option><option value="ACTIVE">فعال</option><option value="INACTIVE">غیرفعال</option><option value="UNVERIFIED">تأییدنشده</option>
        </select>
      </MembershipCard>

      {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="overflow-hidden rounded-card border border-border/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead className="bg-surface-raised text-muted"><tr><th className="px-4 py-3 font-medium">باشگاه</th><th className="px-4 py-3 font-medium">موقعیت</th><th className="px-4 py-3 font-medium">کاربران و اعضا</th><th className="px-4 py-3 font-medium">اشتراک</th><th className="px-4 py-3 font-medium">وضعیت</th><th className="px-4 py-3 font-medium">عملیات</th></tr></thead>
            <tbody>{visible.map((gym) => (
              <tr key={gym.id} className="border-t border-border/10">
                <td className="px-4 py-4"><p className="font-bold">{gym.name}</p><p className="mt-1 text-xs text-muted">/{gym.slug} · امتیاز {Number(gym.trustScore).toLocaleString('fa-IR')}</p></td>
                <td className="px-4 py-4">{[gym.province, gym.county, gym.city].filter(Boolean).join('، ')}</td>
                <td className="px-4 py-4"><p>{gym._count.users.toLocaleString('fa-IR')} کاربر</p><p className="mt-1 text-xs text-muted">{gym._count.memberships.toLocaleString('fa-IR')} عضویت</p></td>
                <td className="px-4 py-4"><p>{gym.subscription?.plan.name ?? 'بدون پلن'}</p>{gym.subscription && <Badge className="mt-1" tone={gym.subscription.status === 'ACTIVE' ? 'success' : 'warning'}>{gym.subscription.status === 'ACTIVE' ? 'فعال' : gym.subscription.status}</Badge>}</td>
                <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><Badge tone={gym.isActive ? 'success' : 'danger'}>{gym.isActive ? 'فعال' : 'غیرفعال'}</Badge><Badge tone={gym.isVerified ? 'accent' : 'warning'}>{gym.isVerified ? 'تأییدشده' : 'در انتظار تأیید'}</Badge></div></td>
                <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={busyId === gym.id} onClick={() => updateGym(gym, 'verify')}>{gym.isVerified ? 'لغو تأیید' : 'تأیید باشگاه'}</Button><Button size="sm" variant={gym.isActive ? 'danger' : 'primary'} disabled={busyId === gym.id} onClick={() => updateGym(gym, 'active')}>{gym.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</Button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!visible.length && <p className="px-4 py-10 text-center text-sm text-muted">باشگاهی با این فیلتر پیدا نشد.</p>}
      </div>
    </div>
  );
}
