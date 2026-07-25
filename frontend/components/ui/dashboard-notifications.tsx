import { cookies } from 'next/headers';
import { api } from '../../lib/api';
import { NotificationItem, NotificationsPanel } from './notifications-panel';

async function getNotifications() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<NotificationItem[]>('/notifications/mine', { accessToken: token }); } catch { return []; }
}

export async function DashboardNotifications() {
  const notifications = await getNotifications();
  const unread = notifications.filter((item) => !item.isRead).length;
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">اعلان‌ها</h1><p className="text-muted">{unread ? `${unread.toLocaleString('fa-IR')} اعلان خوانده‌نشده` : 'همه اعلان‌ها خوانده شده‌اند'}</p></header><NotificationsPanel initial={notifications} /></div>;
}
