import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { Badge } from '../../../../components/ui/badge';
import { GoalForm } from '../../../../components/ui/goal-form';

interface Goal { id: string; type: string; targetValue?: number | null; targetDate?: string | null; achieved: boolean }
const LABELS: Record<string, string> = { FAT_LOSS: 'کاهش چربی', MUSCLE_GAIN: 'عضله‌سازی', GENERAL_FITNESS: 'تناسب اندام', ENDURANCE: 'استقامت', REHABILITATION: 'بازتوانی' };
async function getGoals() { const token = (await cookies()).get('accessToken')?.value; return api.get<Goal[]>('/athletes/me/goals', { accessToken: token }).catch(() => []); }
export default async function GoalsPage() { const goals = await getGoals(); return <div className="flex flex-col gap-6"><header><p className="mb-1 text-sm text-accent-soft">پنل ورزشکار</p><h1 className="text-2xl font-extrabold sm:text-3xl">هدف‌های ورزشی</h1><p className="mt-2 text-sm text-muted">هدف‌گذاری قابل‌اندازه‌گیری و پیگیری مستمر روند رسیدن به آن</p></header><MembershipCard><h2 className="mb-5 font-bold">هدف جدید</h2><GoalForm /></MembershipCard><div className="grid gap-4 sm:grid-cols-2">{goals.map((goal) => <MembershipCard key={goal.id}><div className="flex items-center justify-between"><h2 className="font-bold">{LABELS[goal.type] ?? goal.type}</h2><Badge tone={goal.achieved ? 'success' : 'accent'}>{goal.achieved ? 'تکمیل‌شده' : 'فعال'}</Badge></div><p className="mt-4 text-sm text-muted">مقدار هدف: <span className="text-ink">{goal.targetValue ?? 'بدون مقدار عددی'}</span></p><p className="mt-2 text-sm text-muted">مهلت: <span className="text-ink">{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('fa-IR-u-ca-persian') : 'بدون مهلت'}</span></p></MembershipCard>)}{!goals.length && <MembershipCard className="sm:col-span-2 text-center text-muted">هنوز هدفی ثبت نشده است.</MembershipCard>}</div></div>; }

