import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { PlatformGym, PlatformGymsManager } from '../../../../components/ui/platform-gyms-manager';

export default async function PlatformGymsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const gyms = await api.get<PlatformGym[]>('/super-admin/tenants', { accessToken: token });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت باشگاه‌ها</h1>
        <p className="mt-1 text-muted">تأیید هویت، کنترل دسترسی و مشاهده وضعیت عضویت باشگاه‌های پلتفرم</p>
      </header>
      <PlatformGymsManager initialGyms={gyms} />
    </div>
  );
}
