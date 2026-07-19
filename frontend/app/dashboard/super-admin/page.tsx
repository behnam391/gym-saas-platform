import { cookies } from 'next/headers';
import { Building2, Users, Wallet, Ticket } from 'lucide-react';
import { api } from '../../../lib/api';
import { StatCard } from '../../../components/ui/stat-card';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Badge } from '../../../components/ui/badge';

interface Overview {
  tenantCount: number;
  userCount: number;
  activeMemberships: number;
  openTickets: number;
}

interface PendingNutritionist {
  id: string;
  user: { firstName: string; lastName: string; tenantId: string };
}

async function getOverview(): Promise<Overview | null> {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    return await api.get<Overview>('/super-admin/overview', { accessToken: token });
  } catch {
    return null;
  }
}

async function getPendingNutritionists(): Promise<PendingNutritionist[]> {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    return await api.get<PendingNutritionist[]>('/nutritionists/pending', { accessToken: token });
  } catch {
    return [];
  }
}

export default async function SuperAdminOverviewPage() {
  const [overview, pending] = await Promise.all([getOverview(), getPendingNutritionists()]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">نمای کلی پلتفرم</h1>
        <p className="text-muted">آمار سراسری تمام باشگاه‌های عضو سامانه</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="باشگاه‌های ثبت‌شده" value={overview?.tenantCount ?? '—'} icon={Building2} />
        <StatCard label="کل کاربران" value={overview?.userCount ?? '—'} icon={Users} />
        <StatCard label="عضویت‌های فعال" value={overview?.activeMemberships ?? '—'} icon={Wallet} />
        <StatCard label="تیکت‌های باز" value={overview?.openTickets ?? '—'} icon={Ticket} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">متخصصان تغذیه در انتظار تایید</h2>
        {pending.length === 0 ? (
          <MembershipCard className="text-center text-muted">موردی در انتظار تایید نیست.</MembershipCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pending.map((p) => (
              <MembershipCard key={p.id} className="flex items-center justify-between">
                <p className="font-bold">{p.user.firstName} {p.user.lastName}</p>
                <Badge tone="warning">در انتظار بررسی</Badge>
              </MembershipCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
