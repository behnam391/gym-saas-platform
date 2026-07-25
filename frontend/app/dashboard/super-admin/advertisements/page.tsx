import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AdminAdvertisementsPanel } from '../../../../components/ui/admin-advertisements-panel';
export default async function AdvertisementsPage() { const token = (await cookies()).get('accessToken')?.value; const items = await api.get<any[]>('/advertisements/admin', { accessToken: token }); return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">مدیریت تبلیغات باشگاه‌ها</h1><p className="text-muted">بررسی و انتشار جایگاه‌های ویژه استانی و شهری</p></header><AdminAdvertisementsPanel initial={items} /></div>; }
