import { cookies } from 'next/headers';
import { api } from '../../lib/api';
import { ConversationSummary, MessagesPanel } from './messages-panel';

async function getConversations() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<ConversationSummary[]>('/messages/conversations', { accessToken: token }); } catch { return []; }
}

export async function DashboardMessages() {
  const conversations = await getConversations();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">پیام‌ها</h1><p className="text-muted">گفت‌وگوی مستقیم و امن در فضای باشگاه</p></header><MessagesPanel initial={conversations} /></div>;
}
