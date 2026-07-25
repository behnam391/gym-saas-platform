import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AttendanceDevicesManager } from '../../../../components/ui/attendance-devices-manager';

export default async function GymDevicesPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const devices = await api.get<any[]>('/attendance-devices', { accessToken: token });
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">دستگاه‌های ورود و خروج</h1><p className="text-muted">کارت، اثر انگشت، تشخیص چهره و NFC گوشی در یک مرکز اتصال</p></header><AttendanceDevicesManager initial={devices} /></div>;
}
