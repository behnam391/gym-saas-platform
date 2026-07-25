import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AdvertisementsManager } from '../../../../components/ui/advertisements-manager';

export default async function GymAdvertisementsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const items = await api.get<any[]>('/advertisements/mine', { accessToken: token });
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">تبلیغات در بازار باشگاه‌ها</h1><p className="text-muted">نمایش ویژه باشگاه در استان یا شهرستان انتخابی</p></header><AdvertisementsManager initial={items} /></div>;
}
