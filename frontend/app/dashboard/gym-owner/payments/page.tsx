import { OwnerFinancePanel } from '../../../../components/ui/owner-finance-panel';
import { getOwnerFinance } from '../../../../lib/owner-finance';

export default async function PaymentsPage() {
  const data = await getOwnerFinance();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">پرداخت‌ها</h1><p className="text-muted">مشاهده تراکنش‌های عضویت و درآمد ثبت‌شده باشگاه</p></header><OwnerFinancePanel {...data} /></div>;
}
