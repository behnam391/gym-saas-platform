import Link from 'next/link';
import { Dumbbell, Building2, UserRound, Apple, ClipboardCheck, Coffee, ShieldCheck, ArrowLeft } from 'lucide-react';
import { LOGIN_PORTALS, LoginPortalKey } from '../../../lib/login-portals';

const ICONS = { athlete: Dumbbell, owner: Building2, trainer: UserRound, nutritionist: Apple, reception: ClipboardCheck, buffet: Coffee, admin: ShieldCheck };

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(228,199,102,.16),transparent_35%),radial-gradient(circle_at_10%_100%,rgba(76,175,109,.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 font-extrabold text-accent-soft"><Dumbbell className="size-5" /> باشگاه‌یار</Link>
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-accent-soft">ورود یکپارچه، مسیرهای مستقل</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">برای ورود، نقش خودتان را انتخاب کنید</h1>
          <p className="mt-4 leading-7 text-muted">هر بخش درگاه و سطح دسترسی جدا دارد و برای تبدیل شدن به اپلیکیشن مستقل در آینده آماده شده است.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(LOGIN_PORTALS) as LoginPortalKey[]).map((key) => {
            const portal = LOGIN_PORTALS[key];
            const Icon = ICONS[key];
            return (
              <Link key={key} href={`/auth/login/${key}`} className={`membership-card group flex items-center gap-4 p-5 transition hover:-translate-y-1 ${key === 'admin' ? 'lg:col-start-2' : ''}`}>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-raised text-accent-soft"><Icon className="size-5" /></span>
                <span className="min-w-0 flex-1"><span className="block font-extrabold">{portal.title}</span><span className="mt-1 block text-sm text-muted">{portal.subtitle}</span></span>
                <ArrowLeft className="size-4 text-muted transition-transform group-hover:-translate-x-1" />
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
