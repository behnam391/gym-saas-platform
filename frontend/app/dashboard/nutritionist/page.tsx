import { cookies } from 'next/headers';
import { Sparkles, Users, Utensils } from 'lucide-react';
import { api } from '../../../lib/api';
import { Badge } from '../../../components/ui/badge';
import { MembershipCard } from '../../../components/ui/membership-card';
import { StatCard } from '../../../components/ui/stat-card';
import { ManagedDietPlan, NutritionClientItem } from '../../../components/ui/diet-plan-manager';

interface Profile { status: string; bio?: string | null }

async function getData() {
  const token = (await cookies()).get('accessToken')?.value;
  const [profile, clients] = await Promise.all([
    api.get<Profile | null>('/nutritionists/me', { accessToken: token }).catch(() => null),
    api.get<NutritionClientItem[]>('/nutritionists/clients', { accessToken: token }).catch(() => []),
  ]);
  const plans = (await Promise.all(clients.map((client) => api.get<ManagedDietPlan[]>(`/diet/athlete/${client.userId}`, { accessToken: token }).catch(() => [])))).flat();
  return { profile, clients, plans };
}

export default async function NutritionistOverviewPage() {
  const data = await getData();
  const approved = data.profile?.status === 'APPROVED';
  return <div className="flex flex-col gap-6"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-extrabold">نمای کلی متخصص تغذیه</h1><p className="text-muted">مراجعان فعال و رژیم‌های غذایی در حال اجرا</p></div><Badge tone={approved ? 'success' : 'warning'}>{approved ? 'تاییدشده توسط مدیر ارشد' : 'در انتظار تایید'}</Badge></header>{!approved && <MembershipCard className="border-warning/40 text-warning">تا تایید نهایی مدارک، امکان ساخت رژیم فعال وجود ندارد.</MembershipCard>}<div className="grid gap-5 sm:grid-cols-3"><StatCard label="مراجعان فعال" value={data.clients.length} icon={Users} /><StatCard label="رژیم‌های فعال" value={data.plans.filter((plan) => plan.status === 'ACTIVE').length} icon={Utensils} /><StatCard label="پیشنهاد AI در انتظار" value={0} icon={Sparkles} /></div><MembershipCard><h2 className="font-bold">آخرین مراجعان</h2><div className="mt-4 divide-y divide-white/10">{data.clients.slice(0, 5).map((client) => <div key={client.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-bold">{client.user.firstName} {client.user.lastName}</p><p className="text-xs text-muted">{client.user.mobile}</p></div><Badge tone="success">فعال</Badge></div>)}{!data.clients.length && <p className="py-5 text-center text-muted">هنوز مراجعه‌کننده‌ای اختصاص داده نشده است.</p>}</div></MembershipCard></div>;
}
