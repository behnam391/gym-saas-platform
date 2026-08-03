import Link from 'next/link';
import { ReactNode } from 'react';
import { BrandLogo } from './brand-logo';

export function PublicPolicyLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-base px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex" aria-label="صفحه اصلی گُردیار">
          <BrandLogo size="sm" />
        </Link>
        <header className="rounded-3xl border border-border/10 bg-surface p-6 sm:p-9">
          <p className="text-sm font-bold text-accent-soft">اسناد رسمی گُردیار</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-3 leading-7 text-muted">{description}</p>
          <p className="mt-4 text-xs text-muted">آخرین به‌روزرسانی: ۱۲ مرداد ۱۴۰۵</p>
        </header>
        <div className="mt-6 grid gap-5 [&_h2]:text-lg [&_h2]:font-extrabold [&_li]:leading-7 [&_p]:leading-8 [&_p]:text-muted [&_section]:rounded-2xl [&_section]:border [&_section]:border-border/10 [&_section]:bg-surface [&_section]:p-5 sm:[&_section]:p-7 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pr-5 [&_ul]:text-muted">
          {children}
        </div>
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/10 py-6 text-sm text-muted">
          <span>© گُردیار؛ سامانه هوشمند ورزش و باشگاه</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">حریم خصوصی</Link>
            <Link href="/terms" className="hover:text-ink">قوانین استفاده</Link>
            <Link href="/" className="hover:text-ink">صفحه اصلی</Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
