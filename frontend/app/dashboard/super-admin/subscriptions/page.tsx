import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { SubscriptionsManager } from '../../../../components/ui/subscriptions-manager';
export default async function SubscriptionsPage() { const token = (await cookies()).get('accessToken')?.value; const data = await api.get<{ plans: any[]; subscriptions: any[] }>('/super-admin/subscriptions', { accessToken: token }); return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">اشتراک‌های پلتفرم</h1><p className="text-muted">پلن، تمدید و وضعیت دسترسی باشگاه‌های عضو</p></header><SubscriptionsManager plans={data.plans} initial={data.subscriptions} /></div>; }
