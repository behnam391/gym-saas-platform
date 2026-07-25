import { OwnerFinancePanel } from '../../../../components/ui/owner-finance-panel';
import { getOwnerFinance } from '../../../../lib/owner-finance';

export default async function RevenuePage() {
  const data = await getOwnerFinance();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">درآمد باشگاه</h1><p className="text-muted">خلاصه مالی، عضویت‌های فعال و آخرین پرداخت‌ها</p></header><OwnerFinancePanel {...data} /></div>;
}
