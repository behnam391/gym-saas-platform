import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { DietPlanManager, ManagedDietPlan, NutritionClientItem } from '../../../../components/ui/diet-plan-manager';

async function getData() {
  const token = (await cookies()).get('accessToken')?.value;
  const clients = await api.get<NutritionClientItem[]>('/nutritionists/clients', { accessToken: token }).catch(() => []);
  const dietLists = await Promise.all(clients.map((client) => api.get<ManagedDietPlan[]>(`/diet/athlete/${client.userId}`, { accessToken: token }).catch(() => [])));
  const plans = [...new Map(dietLists.flat().map((plan) => [plan.id, plan])).values()];
  return { clients, plans };
}

export default async function DietPlansPage() {
  const data = await getData();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">رژیم‌های غذایی</h1><p className="text-muted">طراحی برنامه غذایی و مدیریت رژیم فعال مراجعان</p></header><DietPlanManager clients={data.clients} initialPlans={data.plans} /></div>;
}
