import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/10 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-7 text-sm text-muted sm:px-6">
        <p>© گُردیار؛ سامانه هوشمند ورزش و باشگاه</p>
        <nav className="flex flex-wrap gap-5">
          <Link href="/privacy" className="hover:text-ink">حریم خصوصی</Link>
          <Link href="/terms" className="hover:text-ink">قوانین استفاده</Link>
          <Link href="/access/athlete" className="hover:text-ink">حساب ورزشکار</Link>
          <Link href="/access/gym-owner" className="hover:text-ink">مدیر باشگاه</Link>
        </nav>
      </div>
    </footer>
  );
}
