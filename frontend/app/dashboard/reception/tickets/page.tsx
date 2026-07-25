import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { TicketsPanel } from '../../../../components/ui/tickets-panel';

interface TicketItem { id: string; subject: string; description: string; status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }

export default async function ReceptionTicketsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const tickets = await api.get<TicketItem[]>('/tickets', { accessToken: token }).catch(() => []);
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">تیکت‌های باشگاه</h1><p className="text-muted">رسیدگی به درخواست‌ها و مشکلات ثبت‌شده اعضا</p></header><TicketsPanel initial={tickets} /></div>;
}
