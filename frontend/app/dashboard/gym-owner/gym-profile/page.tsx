import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { GymProfileManager } from '../../../../components/ui/gym-profile-manager';
export default async function GymProfilePage() { const token = (await cookies()).get('accessToken')?.value; const profile = await api.get<any>('/tenants/me/profile', { accessToken: token }); return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">پروفایل عمومی باشگاه</h1><p className="text-muted">اطلاعاتی که در بازار باشگاه‌ها به کاربران نمایش داده می‌شود</p></header><GymProfileManager initial={profile} /></div>; }
