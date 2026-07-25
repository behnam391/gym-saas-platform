import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { ManagedMembershipPlan, MembershipPlansManager } from '../../../../components/ui/membership-plans-manager';

async function getPlans() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<ManagedMembershipPlan[]>('/tenants/me/membership-plans', { accessToken: token }); } catch { return []; }
}

export default async function MembershipsPage() {
  const plans = await getPlans();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">پلن‌های عضویت</h1><p className="text-muted">تعریف، قیمت‌گذاری و مدیریت پلن‌های قابل خرید باشگاه</p></header><MembershipPlansManager initial={plans} /></div>;
}
