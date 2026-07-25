import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AttendanceDevicesManager } from '../../../../components/ui/attendance-devices-manager';

export default async function GymDevicesPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const [devices, credentials, members] = await Promise.all([
    api.get<any[]>('/attendance-devices', { accessToken: token }),
    api.get<any[]>('/attendance-devices/credentials', { accessToken: token }),
    api.get<any[]>('/tenants/me/members', { accessToken: token }),
  ]);
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">مرکز ورود و خروج مکانیزه</h1><p className="mt-1 text-muted">افزودن دستگاه، اتصال شناسه اعضا و ثبت تردد با کارت، اثر انگشت، تشخیص چهره یا NFC گوشی</p></header><AttendanceDevicesManager initial={devices} initialCredentials={credentials} members={members} /></div>;
}
