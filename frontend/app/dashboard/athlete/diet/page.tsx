import { cookies } from 'next/headers';
import { Apple, Flame, Utensils } from 'lucide-react';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { Badge } from '../../../../components/ui/badge';

interface Profile { id: string }
interface Meal { id: string; mealTime: string; description: string; calories?: number | null }
interface DietPlan {
  id: string;
  title: string;
  goal: string;
  dailyCalories?: number | null;
  status: string;
  nutritionist?: { user?: { firstName: string; lastName: string } };
  meals: Meal[];
}

async function getDiets() {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    const profile = await api.get<Profile>('/athletes/me/profile', { accessToken: token });
    return await api.get<DietPlan[]>(`/diet/athlete/${profile.id}`, { accessToken: token });
  } catch {
    return [];
  }
}

export default async function AthleteDietPage() {
  const diets = await getDiets();
  const active = diets.find((diet) => diet.status === 'ACTIVE') ?? diets[0];

  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">برنامه غذایی من</h1><p className="text-muted">رژیم تأییدشده توسط متخصص تغذیه</p></header>
      {!active ? (
        <MembershipCard className="text-center"><Apple className="mx-auto size-10 text-accent-soft" /><h2 className="mt-3 text-lg font-bold">هنوز رژیم غذایی ثبت نشده است</h2></MembershipCard>
      ) : (
        <>
          <MembershipCard>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><Badge tone="success">فعال</Badge><span className="text-sm text-muted">هدف: {active.goal}</span></div><h2 className="mt-3 text-xl font-extrabold">{active.title}</h2><p className="mt-1 text-sm text-muted">متخصص: {active.nutritionist?.user ? `${active.nutritionist.user.firstName} ${active.nutritionist.user.lastName}` : 'تعیین نشده'}</p></div>
              <div className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 text-accent-soft"><Flame className="size-5" /><strong>{active.dailyCalories?.toLocaleString('fa-IR') ?? '—'} کالری</strong></div>
            </div>
          </MembershipCard>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.meals.map((meal) => (
              <MembershipCard key={meal.id}>
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-accent-soft">{meal.mealTime}</span><Utensils className="size-5 text-muted" /></div>
                <p className="mt-3 leading-7">{meal.description}</p>
                {meal.calories != null && <p className="mt-3 text-sm text-muted">{meal.calories.toLocaleString('fa-IR')} کالری</p>}
              </MembershipCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
