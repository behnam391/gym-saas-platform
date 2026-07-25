import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { MeasurementForm } from '../../../../components/ui/measurement-form';

interface Measurement { id: string; recordedAt: string; weightKg?: number | null; waistCm?: number | null; chestCm?: number | null; bodyFatPercent?: number | null }

async function getMeasurements() { const token = (await cookies()).get('accessToken')?.value; return api.get<Measurement[]>('/athletes/me/measurements', { accessToken: token }).catch(() => []); }

export default async function MeasurementsPage() {
  const measurements = await getMeasurements();
  return <div className="flex flex-col gap-6"><header><p className="mb-1 text-sm text-accent-soft">پنل ورزشکار</p><h1 className="text-2xl font-extrabold sm:text-3xl">اندازه‌گیری‌های بدن</h1><p className="mt-2 text-sm text-muted">ثبت منظم داده‌ها برای تحلیل روند و بهبود پیشنهادهای هوشمند</p></header><MembershipCard><h2 className="mb-5 font-bold">ثبت اندازه‌گیری جدید</h2><MeasurementForm /></MembershipCard><MembershipCard className="overflow-hidden p-0"><div className="border-b border-border/10 px-5 py-4 font-bold">تاریخچه اندازه‌گیری‌ها</div>{measurements.length ? <div className="divide-y divide-border/10">{measurements.map((item) => <div key={item.id} className="grid grid-cols-2 gap-3 px-5 py-4 text-sm sm:grid-cols-5"><span>{new Date(item.recordedAt).toLocaleDateString('fa-IR-u-ca-persian')}</span><span className="text-muted">وزن: {item.weightKg ?? '—'}</span><span className="text-muted">کمر: {item.waistCm ?? '—'}</span><span className="text-muted">سینه: {item.chestCm ?? '—'}</span><span className="text-muted">چربی: {item.bodyFatPercent ?? '—'}٪</span></div>)}</div> : <p className="p-8 text-center text-muted">هنوز اندازه‌گیری‌ای ثبت نشده است.</p>}</MembershipCard></div>;
}

