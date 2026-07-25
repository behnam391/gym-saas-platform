import Link from 'next/link';
import { Clock3, QrCode, ShieldCheck, Ticket, Users } from 'lucide-react';
import { StatCard } from '../../../components/ui/stat-card';
import { MembershipCard } from '../../../components/ui/membership-card';
import { buttonStyles } from '../../../components/ui/button';
import { getReceptionData } from '../../../lib/reception-data';
import { cookies } from 'next/headers';
import { api } from '../../../lib/api';

interface TicketItem { id: string; status: string }

export default async function ReceptionOverviewPage() {
  const data = await getReceptionData();
  const token = (await cookies()).get('accessToken')?.value;
  const tickets = await api.get<TicketItem[]>('/tickets', { accessToken: token }).catch(() => []);
  const present = data.records.filter((item) => !item.checkOutAt).length;
  const pendingDocuments = data.members.filter((member) => member.insuranceDocs[0]?.status === 'PENDING' || member.isRestricted).length;
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">نمای کلی پذیرش</h1><p className="text-muted">عملیات روزانه اعضا، ورود و مدارک نیازمند بررسی</p></header><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="اعضای ثبت‌شده" value={data.members.length} icon={Users} /><StatCard label="حاضرین فعلی" value={present} icon={QrCode} /><StatCard label="مدارک نیازمند بررسی" value={pendingDocuments} icon={ShieldCheck} /><StatCard label="تیکت باز" value={tickets.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length} icon={Ticket} /></div><div className="grid gap-5 md:grid-cols-2"><MembershipCard><h2 className="flex items-center gap-2 font-bold"><QrCode className="size-5 text-accent-soft" />ثبت سریع حضور</h2><p className="mt-2 text-sm leading-6 text-muted">ورود عضو را با انتخاب نام، کارت عضویت یا کد QR ثبت کنید.</p><Link href="/dashboard/reception/check-in" className={buttonStyles({ className: 'mt-5' })}>رفتن به ثبت حضور</Link></MembershipCard><MembershipCard><h2 className="flex items-center gap-2 font-bold"><Clock3 className="size-5 text-accent-soft" />صف بررسی اعضا</h2><p className="mt-2 text-sm leading-6 text-muted">{pendingDocuments.toLocaleString('fa-IR')} پرونده برای بیمه یا رضایت‌نامه نیازمند اقدام است.</p><Link href="/dashboard/reception/members" className={buttonStyles({ variant: 'secondary', className: 'mt-5' })}>مشاهده اعضا</Link></MembershipCard></div></div>;
}
