import { cookies } from 'next/headers';
import { BadgeCheck, Ticket, Users, Wallet } from 'lucide-react';
import { api } from '../../../lib/api';
import { StatCard } from '../../../components/ui/stat-card';
import { CrowdStatusWidget } from '../../../components/ui/crowd-status-widget';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Badge } from '../../../components/ui/badge';

interface PaymentSummary { revenueThisMonth: number; successfulPaymentsThisMonth: number; pendingPayments: number; activeMemberships: number }
interface Member { id: string; firstName: string; lastName: string; mobile: string; isRestricted: boolean; memberships: Array<{ status: string; plan: { title: string } }> }
interface TicketItem { id: string; subject: string; status: string; priority: string }
interface TrainerItem { id: string }

async function getOwnerData() {
  const token = (await cookies()).get('accessToken')?.value;
  const options = { accessToken: token };
  const [summary, members, tickets, pendingTrainers] = await Promise.all([
    api.get<PaymentSummary>('/payments/summary', options).catch(() => null),
    api.get<Member[]>('/tenants/me/members', options).catch(() => []),
    api.get<TicketItem[]>('/tickets', options).catch(() => []),
    api.get<TrainerItem[]>('/trainers/pending', options).catch(() => []),
  ]);
  return { summary, members, tickets, pendingTrainers };
}
export default async function GymOwnerOverviewPage() {
  const { summary, members, tickets, pendingTrainers } = await getOwnerData();
  const openTickets = tickets.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS');

  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">نمای کلی باشگاه</h1><p className="text-muted">خلاصه زنده اعضا، درآمد، حضور و درخواست‌های نیازمند اقدام</p></header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="اعضای فعال" value={summary?.activeMemberships ?? members.length} icon={Users} />
        <StatCard label="مربی در انتظار تایید" value={pendingTrainers.length} icon={BadgeCheck} />
        <StatCard label="درآمد این ماه" value={`${(summary?.revenueThisMonth ?? 0).toLocaleString('fa-IR')} تومان`} icon={Wallet} />
        <StatCard label="تیکت نیازمند اقدام" value={openTickets.length} icon={Ticket} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3"><CrowdStatusWidget /><MembershipCard className="lg:col-span-2"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">آخرین اعضا</h2><span className="text-xs text-muted">{members.length.toLocaleString('fa-IR')} عضو ثبت‌شده</span></div><div className="divide-y divide-border/10">{members.slice(0, 4).map((member) => <div key={member.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-bold">{member.firstName} {member.lastName}</p><p className="text-xs text-muted">{member.mobile} · {member.memberships[0]?.plan.title ?? 'بدون پلن'}</p></div><Badge tone={member.isRestricted ? 'warning' : 'success'}>{member.isRestricted ? 'محدود' : 'فعال'}</Badge></div>)}{!members.length && <p className="py-6 text-center text-muted">هنوز عضوی ثبت نشده است.</p>}</div></MembershipCard></div>
    </div>
  );
}
