import { cookies } from 'next/headers';
import { CalendarCheck2, LogIn, LogOut } from 'lucide-react';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';

interface Attendance { id: string; checkInAt: string; checkOutAt?: string | null; method: string }

async function getAttendance() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<Attendance[]>('/athletes/me/attendance', { accessToken: token }); } catch { return []; }
}

function time(value?: string | null) { return value ? new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : 'در باشگاه'; }

export default async function AthleteAttendancePage() {
  const records = await getAttendance();
  const thisMonth = records.filter((item) => Date.now() - new Date(item.checkInAt).getTime() < 30 * 86400000).length;
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">سوابق حضور</h1><p className="text-muted">ورود و خروج‌های ثبت‌شده در باشگاه</p></header>
      <div className="grid gap-5 sm:grid-cols-2"><MembershipCard><p className="text-sm text-muted">حضور در ۳۰ روز اخیر</p><p className="mt-2 text-2xl font-extrabold">{thisMonth.toLocaleString('fa-IR')} جلسه</p></MembershipCard><MembershipCard><p className="text-sm text-muted">کل سوابق اخیر</p><p className="mt-2 text-2xl font-extrabold">{records.length.toLocaleString('fa-IR')} رکورد</p></MembershipCard></div>
      <MembershipCard className="overflow-hidden p-0">
        {records.length === 0 ? <div className="p-8 text-center text-muted"><CalendarCheck2 className="mx-auto mb-3 size-9" />سابقه حضوری ثبت نشده است.</div> : (
          <div className="divide-y divide-white/10">
            {records.map((record) => (
              <div key={record.id} className="grid gap-3 p-5 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center">
                <div><p className="font-bold">{new Date(record.checkInAt).toLocaleDateString('fa-IR-u-ca-persian', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p><p className="mt-1 text-xs text-muted">روش ثبت: {record.method === 'QR_CODE' ? 'کد QR' : record.method === 'MEMBERSHIP_CARD' ? 'کارت عضویت' : 'ثبت دستی'}</p></div>
                <div className="flex items-center gap-2 text-sm"><LogIn className="size-4 text-success" />ورود: {time(record.checkInAt)}</div>
                <div className="flex items-center gap-2 text-sm"><LogOut className="size-4 text-warning" />خروج: {time(record.checkOutAt)}</div>
              </div>
            ))}
          </div>
        )}
      </MembershipCard>
    </div>
  );
}
