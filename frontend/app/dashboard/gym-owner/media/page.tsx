import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { GymMediaManager } from '../../../../components/ui/gym-media-manager';

export default async function GymMediaPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const profile = await api.get<{ galleryImages: any[] }>('/tenants/me/profile', { accessToken: token });
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">تصاویر و هویت باشگاه</h1><p className="text-muted">گالری، تصویر کاور و نشان قابل نمایش در صفحه عمومی</p></header><GymMediaManager initial={profile.galleryImages ?? []} /></div>;
}
