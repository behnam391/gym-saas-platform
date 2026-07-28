import Link from 'next/link';
import { ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';
import { BrandLogo } from '../../../../components/ui/brand-logo';
import { MembershipCard } from '../../../../components/ui/membership-card';

export default function ProfessionalRegistrationPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(228,199,102,.14),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(76,175,109,.10),transparent_30%)]" />
      <div className="relative w-full max-w-xl">
        <Link href="/" className="mb-7 flex w-fit" aria-label="صفحه اصلی گُردیار"><BrandLogo size="sm" /></Link>
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowRight className="size-4" /> صفحه اصلی</Link>
        <MembershipCard className="p-7 sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent-soft"><Stethoscope className="size-5" /></span>
          <p className="mt-5 flex items-center gap-2 text-sm font-bold text-success"><ShieldCheck className="size-4" />عضویت حرفه‌ای کنترل‌شده</p>
          <h1 className="mt-2 text-3xl font-extrabold">ثبت‌نام عمومی متخصصان غیرفعال است</h1>
          <p className="mt-4 leading-7 text-muted">مربی و مشاور تغذیهٔ داخلی توسط مدیر همان باشگاه ساخته می‌شود. متخصصان سراسری نیز فقط پس از احراز صلاحیت توسط مدیریت اصلی سامانه به فهرست کشور اضافه می‌شوند.</p>
        </MembershipCard>
      </div>
    </main>
  );
}
