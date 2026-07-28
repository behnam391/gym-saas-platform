import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { BrandLogo } from './brand-logo';
import { LogoutButton } from './logout-button';
import { ThemeToggle } from './theme-toggle';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden max-h-screen w-64 flex-col overflow-y-auto border-l border-border/10 bg-surface px-4 py-8 lg:sticky lg:top-0 lg:flex">
        <Link href="/" className="mb-8 px-2" aria-label="صفحه اصلی گُردیار">
          <BrandLogo size="sm" subtitle={title} />
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 pt-6">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="border-b border-border/10 bg-surface lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" aria-label="صفحه اصلی گُردیار">
              <BrandLogo size="sm" showSubtitle={false} />
            </Link>
            <div className="flex items-center gap-2"><ThemeToggle /><LogoutButton compact /></div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-surface-raised px-3 py-2 text-xs font-medium text-muted"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
