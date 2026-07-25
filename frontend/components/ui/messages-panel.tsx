'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Button } from './button';

interface Person { id: string; firstName: string; lastName: string; role: string }
interface Message { id: string; body: string; createdAt: string; sender: Person; isRead: boolean }
export interface ConversationSummary {
  conversationId: string;
  otherUser: Person | null;
  lastMessage: Message;
  unreadCount: number;
}

const ROLE_LABEL: Record<string, string> = { TRAINER: 'مربی', NUTRITIONIST: 'متخصص تغذیه', ATHLETE: 'ورزشکار', GYM_OWNER: 'مدیر باشگاه', RECEPTION: 'پذیرش' };

export function MessagesPanel({ initial }: { initial: ConversationSummary[] }) {
  const [conversations, setConversations] = useState(initial);
  const [selected, setSelected] = useState(initial[0]?.conversationId ?? '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = conversations.find((item) => item.conversationId === selected);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    Promise.all([
      api.get<Message[]>(`/messages/conversations/${selected}`),
      api.patch(`/messages/conversations/${selected}/read`),
    ]).then(([list]) => {
      if (!cancelled) {
        setMessages(list);
        setConversations((items) => items.map((item) => item.conversationId === selected ? { ...item, unreadCount: 0 } : item));
      }
    }).catch(() => !cancelled && setError('دریافت پیام‌ها انجام نشد.'));
    return () => { cancelled = true; };
  }, [selected]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || !active?.otherUser) return;
    setBusy(true);
    setError('');
    try {
      const message = await api.post<Message>('/messages', { recipientId: active.otherUser.id, body: body.trim() });
      setMessages((items) => [...items, message]);
      setConversations((items) => items.map((item) => item.conversationId === selected ? { ...item, lastMessage: message } : item));
      setBody('');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ارسال پیام انجام نشد.');
    } finally { setBusy(false); }
  }

  if (!conversations.length) return <MembershipCard className="text-center text-muted"><MessageCircle className="mx-auto mb-3 size-9" />هنوز گفت‌وگویی برای شما ایجاد نشده است.</MembershipCard>;

  return (
    <div className="grid min-h-[560px] gap-5 lg:grid-cols-[280px_1fr]">
      <MembershipCard className="h-fit p-3">
        {conversations.map((item) => (
          <button key={item.conversationId} onClick={() => setSelected(item.conversationId)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-right transition ${selected === item.conversationId ? 'bg-accent/15' : 'hover:bg-white/5'}`}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised font-bold text-accent-soft">{item.otherUser?.firstName?.[0] ?? '؟'}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-bold">{item.otherUser ? `${item.otherUser.firstName} ${item.otherUser.lastName}` : 'کاربر'}</span><span className="block truncate text-xs text-muted">{item.lastMessage.body}</span></span>
            {item.unreadCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-base">{item.unreadCount.toLocaleString('fa-IR')}</span>}
          </button>
        ))}
      </MembershipCard>

      <MembershipCard className="flex min-h-[540px] flex-col p-0">
        <div className="border-b border-white/10 p-5"><h2 className="font-bold">{active?.otherUser ? `${active.otherUser.firstName} ${active.otherUser.lastName}` : 'گفت‌وگو'}</h2><p className="text-xs text-muted">{active?.otherUser ? ROLE_LABEL[active.otherUser.role] ?? active.otherUser.role : ''}</p></div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {messages.map((message) => {
            const fromOther = message.sender.id === active?.otherUser?.id;
            return <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 ${fromOther ? 'self-start bg-surface-raised' : 'self-end bg-accent/20'}`}><p className="leading-7">{message.body}</p><p className="mt-1 text-[10px] text-muted">{new Date(message.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p></div>;
          })}
        </div>
        <form onSubmit={send} className="border-t border-white/10 p-4"><div className="flex gap-2"><input value={body} onChange={(event) => setBody(event.target.value)} placeholder="پیام خود را بنویسید…" className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-surface px-4 outline-none focus:border-accent" /><Button type="submit" disabled={busy || !body.trim()} aria-label="ارسال پیام"><Send className="size-4" /></Button></div>{error && <p className="mt-2 text-xs text-danger">{error}</p>}</form>
      </MembershipCard>
    </div>
  );
}
