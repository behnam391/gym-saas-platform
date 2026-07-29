import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AttendanceManager, AttendanceRecord } from '../../../../components/ui/attendance-manager';
import { AttendanceReport } from '../../../../components/ui/attendance-report';

interface Member { id: string; firstName: string; lastName: string; mobile: string; memberships: Array<{ id: string; status: string; plan: { title: string } }> }

async function getData() {
  const token = (await cookies()).get('accessToken')?.value;
  const [records, members] = await Promise.all([
    api.get<AttendanceRecord[]>('/attendance/recent', { accessToken: token }).catch(() => []),
    api.get<Member[]>('/tenants/me/members', { accessToken: token }).catch(() => []),
  ]);
  return { records, members };
}

export default async function AttendancePage() {
  const data = await getData();
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-extrabold">حضور و غیاب</h1>
          <p className="mt-1 text-muted">ثبت ورود و خروج و مشاهده وضعیت لحظه‌ای اعضا</p>
        </header>
        <AttendanceManager initialRecords={data.records} members={data.members} />
      </div>
      <AttendanceReport />
    </div>
  );
}
