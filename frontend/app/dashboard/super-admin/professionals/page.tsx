import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { PlatformProfessional, PlatformProfessionalsManager } from '../../../../components/ui/platform-professionals-manager';

export default async function PlatformProfessionalsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const professionals = await api.get<PlatformProfessional[]>('/platform-professionals/admin/all', { accessToken: token }).catch(() => []);
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">متخصصان سراسری</h1><p className="mt-1 text-muted">مربیان و مشاوران تغذیه‌ای که همه ورزشکاران کشور می‌توانند انتخاب کنند</p></header>
      <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm leading-6">این فهرست مستقل از پرسنل داخلی باشگاه‌هاست و فقط مدیریت اصلی سامانه می‌تواند فردی را به آن اضافه کند.</div>
      <PlatformProfessionalsManager initial={professionals} />
    </div>
  );
}
