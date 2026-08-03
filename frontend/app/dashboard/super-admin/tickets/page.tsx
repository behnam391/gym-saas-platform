import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import {
  TicketItem,
  TicketsPanel,
} from '../../../../components/ui/tickets-panel';

export default async function PlatformTicketsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const tickets = await api.get<TicketItem[]>('/tickets/admin', {
    accessToken: token,
  }).catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">مرکز پشتیبانی سراسری</h1>
        <p className="mt-1 text-muted">
          درخواست‌های ورزشکاران که مستقیماً برای مدیریت گُردیار ثبت شده‌اند
        </p>
      </header>
      <TicketsPanel initial={tickets} />
    </div>
  );
}
