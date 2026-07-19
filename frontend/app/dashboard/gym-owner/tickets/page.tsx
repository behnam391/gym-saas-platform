import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { TicketsPanel } from '../../../../components/ui/tickets-panel';

interface TicketItem {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

async function getTickets(): Promise<TicketItem[]> {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    return await api.get<TicketItem[]>('/tickets', { accessToken: token });
  } catch {
    return [];
  }
}

export default async function GymOwnerTicketsPage() {
  const tickets = await getTickets();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">مرکز تیکت</h1>
        <p className="text-muted">شکایات و درخواست‌های پشتیبانی اعضا، مرتب‌شده بر اساس اولویت</p>
      </header>
      <TicketsPanel initial={tickets} />
    </div>
  );
}
