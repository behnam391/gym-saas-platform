import Link from 'next/link';
import { ArrowLeft, Building2, Dumbbell } from 'lucide-react';
import { BrandLogo } from '../../../components/ui/brand-logo';
import { MembershipCard } from '../../../components/ui/membership-card';

export default function LoginPage() {
  const choices = [
    { href: '/access/athlete', title: 'ورزشکار', description: 'ورود یا ساخت حساب ورزشکاری', icon: Dumbbell },
    { href: '/access/gym-owner', title: 'مدیر باشگاه', description: 'ورود یا درخواست راه‌اندازی باشگاه', icon: Building2 },
  ];
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(228,199,102,.16),transparent_35%),radial-gradient(circle_at_10%_100%,rgba(76,175,109,.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl">
        <Link href="/" className="mb-10 inline-flex" aria-label="صفحه اصلی گُردیار"><BrandLogo /></Link>
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-accent-soft">ورود امن گُردیار</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">چه نوع حسابی دارید؟</h1>
          <p className="mt-4 leading-7 text-muted">ورودی پرسنل و همکاران سازمانی فقط از طریق لینک اختصاصی صادرشده در پنل مدیریت در دسترس است.</p>
        </div>
        <div className="mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
          {choices.map(({ href, title, description, icon: Icon }) => (
            <Link key={href} href={href} className="group">
              <MembershipCard className="flex h-full items-center gap-4 transition group-hover:-translate-y-1 group-hover:border-accent/30">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Icon className="size-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-lg font-extrabold">{title}</span><span className="mt-1 block text-sm text-muted">{description}</span></span>
                <ArrowLeft className="size-4 text-muted transition group-hover:-translate-x-1" />
              </MembershipCard>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
