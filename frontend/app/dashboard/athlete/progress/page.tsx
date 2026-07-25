import { cookies } from 'next/headers';
import { Activity, Dumbbell, Scale, Target, Utensils } from 'lucide-react';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { StatCard } from '../../../../components/ui/stat-card';

interface Measurement { id: string; weightKg?: number | null; recordedAt: string }
interface Progress { latestMeasurement?: Measurement | null; weightChangeKg?: number | null; attendanceLast30Days: number; activePrograms: number; activeDiets: number; measurements: Measurement[] }

async function getProgress() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<Progress>('/athletes/me/progress', { accessToken: token }); } catch { return null; }
}

export default async function AthleteProgressPage() {
  const data = await getProgress();
  const weights = [...(data?.measurements ?? [])].filter((item) => item.weightKg != null).reverse();
  const values = weights.map((item) => Number(item.weightKg));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">روند پیشرفت</h1><p className="text-muted">نمای یکپارچه از تمرین، تغذیه، حضور و تغییرات بدنی</p></header>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="وزن فعلی" value={data?.latestMeasurement?.weightKg != null ? `${Number(data.latestMeasurement.weightKg).toLocaleString('fa-IR')} کیلو` : '—'} icon={Scale} />
        <StatCard label="تغییر وزن" value={data?.weightChangeKg != null ? `${data.weightChangeKg > 0 ? '+' : ''}${Number(data.weightChangeKg).toLocaleString('fa-IR')} کیلو` : '—'} icon={Activity} />
        <StatCard label="حضور ۳۰ روز اخیر" value={data?.attendanceLast30Days ?? 0} icon={Target} />
        <StatCard label="برنامه‌های فعال" value={(data?.activePrograms ?? 0) + (data?.activeDiets ?? 0)} icon={Dumbbell} />
      </div>
      <MembershipCard>
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">نمودار تغییر وزن</h2><p className="text-sm text-muted">آخرین اندازه‌گیری‌های ثبت‌شده</p></div><Scale className="size-6 text-accent-soft" /></div>
        {weights.length < 2 ? <p className="mt-8 text-center text-sm text-muted">برای نمایش روند، حداقل دو اندازه‌گیری ثبت کنید.</p> : (
          <div className="mt-8 flex h-52 items-end gap-3 border-b border-white/10 pb-3">
            {weights.map((item) => {
              const height = max === min ? 100 : 55 + ((Number(item.weightKg) - min) / (max - min)) * 85;
              return <div key={item.id} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-xs font-bold">{Number(item.weightKg).toLocaleString('fa-IR')}</span><div className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-accent/40 to-accent-soft" style={{ height: `${height}px` }} /><span className="truncate text-[10px] text-muted">{new Date(item.recordedAt).toLocaleDateString('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' })}</span></div>;
            })}
          </div>
        )}
      </MembershipCard>
      <div className="grid gap-5 sm:grid-cols-2"><MembershipCard className="flex items-center gap-4"><Dumbbell className="size-8 text-accent-soft" /><div><p className="text-sm text-muted">برنامه تمرینی فعال</p><p className="text-xl font-extrabold">{data?.activePrograms ?? 0}</p></div></MembershipCard><MembershipCard className="flex items-center gap-4"><Utensils className="size-8 text-accent-soft" /><div><p className="text-sm text-muted">برنامه غذایی فعال</p><p className="text-xl font-extrabold">{data?.activeDiets ?? 0}</p></div></MembershipCard></div>
    </div>
  );
}
