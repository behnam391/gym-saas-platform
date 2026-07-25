import { cookies } from 'next/headers';
import { ShoppingBag, PackageCheck, TriangleAlert, Wallet } from 'lucide-react';
import { api } from '../../../lib/api';
import { StatCard } from '../../../components/ui/stat-card';
import { MembershipCard } from '../../../components/ui/membership-card';
import { BuffetOrdersPanel } from '../../../components/ui/buffet-orders-panel';

export default async function BuffetOverviewPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const [summary, orders] = await Promise.all([api.get<any>('/cafeteria/summary', { accessToken: token }), api.get<any[]>('/cafeteria/orders', { accessToken: token })]);
  return <div className="flex flex-col gap-6"><header><p className="text-sm font-bold text-accent-soft">عملیات امروز</p><h1 className="mt-1 text-3xl font-extrabold">داشبورد بوفه</h1><p className="mt-2 text-muted">سفارش‌ها را از دریافت تا تحویل مدیریت کنید.</p></header><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="سفارش در صف" value={summary.openOrders} icon={ShoppingBag} /><StatCard label="آماده تحویل" value={summary.readyOrders} icon={PackageCheck} /><StatCard label="کمبود موجودی" value={summary.lowStock} icon={TriangleAlert} /><StatCard label="فروش تحویل‌شده" value={`${Number(summary.deliveredRevenue).toLocaleString('fa-IR')} ت`} icon={Wallet} /></div><section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">سفارش‌های اخیر</h2><a href="/dashboard/buffet/orders" className="text-sm font-bold text-accent-soft">مشاهده همه</a></div>{orders.length ? <BuffetOrdersPanel initial={orders.slice(0, 4)} /> : <MembershipCard className="text-center text-muted">هنوز سفارشی ثبت نشده است.</MembershipCard>}</section></div>;
}
