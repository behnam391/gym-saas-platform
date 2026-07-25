import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Dumbbell,
  ShieldCheck,
  Stethoscope,
  UserCog,
} from 'lucide-react';
import { MembershipCard } from '../../../components/ui/membership-card';

const OPTIONS = [
  {
    href: '/auth/register/athlete',
    title: 'ثبت‌نام ورزشکار',
    description: 'ساخت حساب شخصی، انتخاب باشگاه و درخواست عضویت',
    icon: Dumbbell,
    badge: 'ثبت‌نام مستقیم',
  },
  {
    href: '/auth/register/gym',
    title: 'راه‌اندازی پنل باشگاه',
    description: 'ثبت مشخصات مجموعه و درخواست بررسی برای صاحب باشگاه',
    icon: Building2,
    badge: 'نیازمند تأیید',
  },
  {
    href: '/auth/register/professional',
    title: 'درخواست همکاری حرفه‌ای',
    description: 'مسیر جداگانه مربیان و متخصصان تغذیه برای بررسی صلاحیت',
    icon: Stethoscope,
    badge: 'بررسی مدارک',
  },
  {
    href: '/auth/register/staff',
    title: 'پذیرش و بوفه',
    description: 'حساب پرسنل فقط با دعوت و تأیید صاحب باشگاه ایجاد می‌شود',
    icon: UserCog,
    badge: 'فقط با دعوت',
  },
];

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(228,199,102,.16),transparent_35%),radial-gradient(circle_at_10%_100%,rgba(76,175,109,.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-5xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 font-extrabold text-accent-soft">
          <Dumbbell className="size-5" /> باشگاه‌یار
        </Link>
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-bold text-success"><ShieldCheck className="size-4" /> ثبت‌نام تفکیک‌شده و کنترل‌شده</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">نوع حسابی که نیاز دارید را انتخاب کنید</h1>
          <p className="mt-4 leading-7 text-muted">ورزشکاران مستقیماً حساب می‌سازند؛ حساب‌های مدیریتی، حرفه‌ای و پرسنلی پس از بررسی یا دعوت فعال می‌شوند.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {OPTIONS.map(({ href, title, description, icon: Icon, badge }) => (
            <Link key={href} href={href} className="group">
              <MembershipCard className="flex h-full items-start gap-4 transition group-hover:-translate-y-1 group-hover:border-accent/30">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Icon className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-accent-soft">{badge}</span>
                  <span className="mt-1 block text-lg font-extrabold">{title}</span>
                  <span className="mt-2 block text-sm leading-6 text-muted">{description}</span>
                </span>
                <ArrowLeft className="mt-4 size-4 text-muted transition group-hover:-translate-x-1" />
              </MembershipCard>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">قبلاً حساب ساخته‌اید؟ <Link href="/auth/login" className="font-bold text-accent-soft">انتخاب درگاه ورود</Link></p>
      </div>
    </main>
  );
}
