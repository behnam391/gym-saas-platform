import Link from 'next/link';
import { ArrowRight, Coffee, ShieldCheck, UserCog } from 'lucide-react';
import { BrandLogo } from '../../../../components/ui/brand-logo';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { buttonStyles } from '../../../../components/ui/button';

export default function StaffRegistrationPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(228,199,102,.14),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(76,175,109,.10),transparent_30%)]" />
      <div className="relative w-full max-w-xl">
        <Link href="/" className="mb-7 flex w-fit" aria-label="صفحه اصلی گُردیار"><BrandLogo size="sm" /></Link>
        <Link href="/auth/register" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowRight className="size-4" /> انتخاب نوع ثبت‌نام</Link>
        <MembershipCard className="p-7 sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><UserCog className="size-5" /></span>
          <p className="mt-5 text-sm font-bold text-accent-soft">ثبت‌نام عمومی غیرفعال است</p>
          <h1 className="mt-1 text-3xl font-extrabold">حساب پذیرش و بوفه فقط با دعوت</h1>
          <p className="mt-4 leading-7 text-muted">برای جلوگیری از ساخت حساب جعلی، صاحب باشگاه باید حساب پرسنل را از داخل پنل مجموعه ایجاد یا دعوت‌نامه صادر کند. پس از دریافت حساب، از درگاه مخصوص نقش خود وارد شوید.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/auth/login/reception" className={buttonStyles({ variant: 'secondary', className: 'w-full' })}><ShieldCheck className="size-4" />ورود پذیرش</Link>
            <Link href="/auth/login/buffet" className={buttonStyles({ variant: 'secondary', className: 'w-full' })}><Coffee className="size-4" />ورود بوفه‌دار</Link>
          </div>
        </MembershipCard>
      </div>
    </main>
  );
}
