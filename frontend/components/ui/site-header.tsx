import Link from 'next/link';
import { Building2, Dumbbell, LogIn, UserPlus } from 'lucide-react';
import { buttonStyles } from './button';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/10 bg-base/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent text-base shadow-lg shadow-accent/10">
            <Dumbbell className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-extrabold sm:text-base">باشگاه‌یار</span>
            <span className="hidden text-[11px] text-muted sm:block">انتخاب، عضویت و مدیریت هوشمند</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/auth/login/athlete"
            aria-label="ورود ورزشکار"
            className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-2' })}
          >
            <LogIn className="size-4" />
            <span className="hidden md:inline">ورود ورزشکار</span>
          </Link>
          <Link
            href="/auth/login/owner"
            aria-label="ورود صاحب باشگاه"
            className={buttonStyles({ variant: 'secondary', size: 'sm', className: 'hidden gap-2 sm:inline-flex' })}
          >
            <Building2 className="size-4" />
            <span className="hidden lg:inline">ورود باشگاه</span>
          </Link>
          <Link
            href="/auth/register/gym"
            aria-label="ثبت باشگاه"
            className={buttonStyles({ size: 'sm', className: 'gap-2' })}
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">ثبت باشگاه</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
