import Link from 'next/link';
import { ArrowRight, Dumbbell, LogIn, UserPlus } from 'lucide-react';
import { buttonStyles } from '../../../components/ui/button';
import { MembershipCard } from '../../../components/ui/membership-card';

export default function AthleteAccessPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(228,199,102,.16),transparent_35%),radial-gradient(circle_at_10%_100%,rgba(76,175,109,.12),transparent_30%)]" />
      <div className="relative w-full max-w-xl">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowRight className="size-4" /> صفحه اصلی</Link>
        <MembershipCard className="p-7 sm:p-9">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Dumbbell className="size-6" /></span>
          <p className="mt-6 text-sm font-bold text-accent-soft">درگاه ورزشکار</p>
          <h1 className="mt-1 text-3xl font-extrabold">به مسیر ورزشی خودت خوش آمدی</h1>
          <p className="mt-4 leading-7 text-muted">اگر قبلاً حساب ساخته‌ای وارد شو؛ در غیر این صورت ثبت‌نام ورزشکار را شروع کن.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link href="/auth/login/athlete" className={buttonStyles({ className: 'w-full' })}><LogIn className="size-4" />ورود ورزشکار</Link>
            <Link href="/auth/register/athlete" className={buttonStyles({ variant: 'secondary', className: 'w-full' })}><UserPlus className="size-4" />ثبت‌نام ورزشکار</Link>
          </div>
        </MembershipCard>
      </div>
    </main>
  );
}
