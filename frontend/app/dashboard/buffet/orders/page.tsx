import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { BuffetOrdersPanel } from '../../../../components/ui/buffet-orders-panel';
export default async function BuffetOrdersPage() { const token = (await cookies()).get('accessToken')?.value; const orders = await api.get<any[]>('/cafeteria/orders', { accessToken: token }); return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">سفارش‌های بوفه</h1><p className="text-muted">صف آماده‌سازی و تحویل سفارش‌های اعضا</p></header><BuffetOrdersPanel initial={orders} /></div>; }
