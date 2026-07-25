import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AdminHeroSlide, HeroSlidesManager } from '../../../../components/ui/hero-slides-manager';

export default async function SiteContentPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const slides = await api.get<AdminHeroSlide[]>('/site-content/admin/hero-slides', { accessToken: token }).catch(() => []);
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">صفحه اصلی و اسلایدر</h1><p className="mt-1 text-muted">مدیریت تصویر ورزشکاران، متن‌های معرفی و ترتیب نمایش اسلایدها</p></header>
      <HeroSlidesManager initial={slides} />
    </div>
  );
}
