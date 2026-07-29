import { FinanceDashboard } from '../../../../components/ui/finance-dashboard';

export default function RevenuePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت مالی باشگاه</h1>
        <p className="mt-1 text-muted">
          درآمدها، مطالبات اعضا، فروش بوفه و جریان پرداخت‌ها
        </p>
      </header>
      <FinanceDashboard />
    </div>
  );
}
