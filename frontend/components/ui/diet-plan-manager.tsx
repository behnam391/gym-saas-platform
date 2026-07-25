'use client';

import { FormEvent, useState } from 'react';
import { Archive, Flame, Plus, Utensils } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface NutritionClientItem {
  id: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; mobile: string };
  athlete: { weightKg?: number | null; heightCm?: number | null; measurements: Array<{ weightKg?: number | null; recordedAt: string }>; goals: Array<{ type: string; targetValue?: number | null }> };
}
interface MealForm { mealTime: string; description: string; calories: string }
export interface ManagedDietPlan { id: string; title: string; goal: string; dailyCalories?: number | null; status: string; meals: Array<{ id: string; mealTime: string; description: string; calories?: number | null }> }
const newMeal = (): MealForm => ({ mealTime: '', description: '', calories: '' });
const GOALS: Record<string, string> = { FAT_LOSS: 'کاهش چربی', MUSCLE_GAIN: 'عضله‌سازی', GENERAL_FITNESS: 'تغذیه متعادل', ENDURANCE: 'استقامت', REHABILITATION: 'بازتوانی' };

export function DietPlanManager({ clients, initialPlans }: { clients: NutritionClientItem[]; initialPlans: ManagedDietPlan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [clientId, setClientId] = useState(clients[0]?.userId ?? '');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('GENERAL_FITNESS');
  const [dailyCalories, setDailyCalories] = useState('2000');
  const [meals, setMeals] = useState<MealForm[]>([newMeal(), newMeal(), newMeal()]);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function updateMeal(index: number, patch: Partial<MealForm>) { setMeals((items) => items.map((item, position) => position === index ? { ...item, ...patch } : item)); }
  async function create(event: FormEvent) {
    event.preventDefault(); setBusyId('new'); setError('');
    try {
      const created = await api.post<ManagedDietPlan>('/diet', { athleteUserId: clientId, title, goal, dailyCalories: Number(dailyCalories), meals: meals.map((meal) => ({ mealTime: meal.mealTime, description: meal.description, calories: meal.calories ? Number(meal.calories) : undefined })) });
      setPlans((items) => [created, ...items]); setTitle(''); setMeals([newMeal(), newMeal(), newMeal()]); setShowForm(false);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'ثبت رژیم انجام نشد.'); }
    finally { setBusyId(null); }
  }
  async function archive(id: string) {
    setBusyId(id); setError('');
    try { await api.patch(`/diet/${id}/status`, { status: 'ARCHIVED' }); setPlans((items) => items.map((item) => item.id === id ? { ...item, status: 'ARCHIVED' } : item)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'بایگانی رژیم انجام نشد.'); }
    finally { setBusyId(null); }
  }

  return <div className="flex flex-col gap-5"><div className="flex justify-end"><Button disabled={!clients.length} onClick={() => setShowForm((value) => !value)}><Plus className="size-4" />رژیم جدید</Button></div>{showForm && <MembershipCard><form onSubmit={create} className="grid gap-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><label className="grid gap-1.5 text-sm"><span className="text-muted">مراجع</span><select value={clientId} onChange={(event) => setClientId(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-surface px-3">{clients.map((client) => <option key={client.id} value={client.userId}>{client.user.firstName} {client.user.lastName}</option>)}</select></label><Input label="عنوان رژیم" value={title} onChange={(event) => setTitle(event.target.value)} required /><label className="grid gap-1.5 text-sm"><span className="text-muted">هدف</span><select value={goal} onChange={(event) => setGoal(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-surface px-3">{Object.entries(GOALS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Input label="کالری روزانه" type="number" value={dailyCalories} onChange={(event) => setDailyCalories(event.target.value)} /></div><div className="grid gap-3">{meals.map((meal, index) => <div key={index} className="grid gap-3 rounded-2xl border border-white/10 p-4 sm:grid-cols-[1fr_2fr_1fr]"><Input label="وعده" placeholder="مثلاً صبحانه" value={meal.mealTime} onChange={(event) => updateMeal(index, { mealTime: event.target.value })} required /><Input label="شرح غذا" value={meal.description} onChange={(event) => updateMeal(index, { description: event.target.value })} required /><Input label="کالری" type="number" value={meal.calories} onChange={(event) => updateMeal(index, { calories: event.target.value })} /></div>)}</div><Button type="button" variant="secondary" onClick={() => setMeals((items) => [...items, newMeal()])}><Plus className="size-4" />افزودن وعده</Button>{error && <p className="text-sm text-danger">{error}</p>}<Button type="submit" disabled={busyId !== null || !clientId}>ثبت و فعال‌سازی رژیم</Button></form></MembershipCard>}<div className="grid gap-5 md:grid-cols-2">{plans.map((plan) => <MembershipCard key={plan.id} className={plan.status === 'ARCHIVED' ? 'opacity-60' : ''}><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-accent-soft">{GOALS[plan.goal] ?? plan.goal}</p><h2 className="mt-1 text-lg font-extrabold">{plan.title}</h2></div><Badge tone={plan.status === 'ACTIVE' ? 'success' : 'muted'}>{plan.status === 'ACTIVE' ? 'فعال' : 'بایگانی'}</Badge></div><div className="mt-4 flex flex-wrap gap-4 text-sm text-muted"><span className="flex items-center gap-1"><Flame className="size-4" />{plan.dailyCalories?.toLocaleString('fa-IR') ?? '—'} کالری</span><span className="flex items-center gap-1"><Utensils className="size-4" />{plan.meals.length.toLocaleString('fa-IR')} وعده</span></div>{plan.status === 'ACTIVE' && <Button size="sm" variant="secondary" className="mt-4" disabled={busyId === plan.id} onClick={() => archive(plan.id)}><Archive className="size-3.5" />بایگانی</Button>}</MembershipCard>)}</div></div>;
}
