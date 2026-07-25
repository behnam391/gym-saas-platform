import { cookies } from 'next/headers';
import { Scale, UserRound } from 'lucide-react';
import { api } from '../../../../lib/api';
import { NutritionClientItem } from '../../../../components/ui/diet-plan-manager';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { Badge } from '../../../../components/ui/badge';

const GOALS: Record<string, string> = { FAT_LOSS: 'کاهش چربی', MUSCLE_GAIN: 'عضله‌سازی', GENERAL_FITNESS: 'تناسب عمومی', ENDURANCE: 'استقامت', REHABILITATION: 'بازتوانی' };

export default async function ClientsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const clients = await api.get<NutritionClientItem[]>('/nutritionists/clients', { accessToken: token }).catch(() => []);
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">مراجعان من</h1><p className="text-muted">وضعیت بدنی و هدف‌های تغذیه‌ای مراجعان فعال</p></header><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{clients.map((client) => { const latest = client.athlete.measurements[0]; const goal = client.athlete.goals[0]; return <MembershipCard key={client.id}><div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-soft"><UserRound className="size-6" /></span><div className="flex-1"><h2 className="font-bold">{client.user.firstName} {client.user.lastName}</h2><p className="text-sm text-muted">{client.user.mobile}</p></div><Badge tone="success">فعال</Badge></div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4"><div><p className="text-xs text-muted">آخرین وزن</p><p className="mt-1 flex items-center gap-1 font-bold"><Scale className="size-4" />{latest?.weightKg ?? client.athlete.weightKg ?? '—'} کیلو</p></div><div><p className="text-xs text-muted">هدف</p><p className="mt-1 font-bold">{goal ? GOALS[goal.type] ?? goal.type : 'ثبت نشده'}</p></div></div></MembershipCard>; })}</div>{!clients.length && <MembershipCard className="text-center text-muted">هنوز مراجعه‌کننده‌ای به شما اختصاص داده نشده است.</MembershipCard>}</div>;
}
