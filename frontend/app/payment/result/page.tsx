import Link from 'next/link';
import { CheckCircle2, CircleX, ReceiptText } from 'lucide-react';
import { MembershipCard } from '../../../components/ui/membership-card';
import { buttonStyles } from '../../../components/ui/button';

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; kind?: string }>;
}) {
  const { status, payment, kind } = await searchParams;
  const success = status === 'success';
  const cancelled = status === 'cancelled';
  const platformSubscription = kind === 'platform';

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-12" dir="rtl">
      <MembershipCard className="w-full max-w-lg text-center">
        {success ? (
          <CheckCircle2 className="mx-auto size-16 text-success" />
        ) : (
          <CircleX className="mx-auto size-16 text-danger" />
        )}
        <h1 className="mt-5 text-2xl font-extrabold">
          {success
            ? 'پرداخت با موفقیت ثبت شد'
            : cancelled
              ? 'پرداخت توسط شما لغو شد'
              : 'پرداخت نهایی نشد'}
        </h1>
        <p className="mt-3 leading-7 text-muted">
          {success
            ? platformSubscription
              ? 'اشتراک گُردیار باشگاه فعال شد و رسید رسمی در پنل اشتراک قابل مشاهده است.'
              : 'عضویت شما فعال شد و رسید رسمی در پنل پرداخت‌ها قابل مشاهده است.'
            : 'مبلغی به‌عنوان پرداخت موفق ثبت نشده است؛ می‌توانید دوباره تلاش کنید.'}
        </p>
        {payment && (
          <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-xl bg-surface-raised px-4 py-2 text-xs text-muted">
            <ReceiptText className="size-4" />
            شناسه رسید: <span dir="ltr">{payment}</span>
          </div>
        )}
        <Link
          href={platformSubscription ? '/dashboard/gym-owner/subscription' : '/dashboard/athlete/payments'}
          className={buttonStyles({ className: 'mt-7' })}
        >
          {platformSubscription ? 'بازگشت به اشتراک باشگاه' : 'مشاهده پرداخت‌ها و رسید'}
        </Link>
      </MembershipCard>
    </main>
  );
}
