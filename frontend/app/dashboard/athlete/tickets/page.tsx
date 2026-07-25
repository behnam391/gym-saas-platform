import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AthleteTicket, AthleteTicketsPanel } from '../../../../components/ui/athlete-tickets-panel';

async function getTickets() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<AthleteTicket[]>('/tickets/mine', { accessToken: token }); } catch { return []; }
}

export default async function Page() {
  const tickets = await getTickets();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">پشتیبانی</h1><p className="text-muted">درخواست‌ها و پاسخ‌های باشگاه را پیگیری کنید</p></header><AthleteTicketsPanel initial={tickets} /></div>;
}
