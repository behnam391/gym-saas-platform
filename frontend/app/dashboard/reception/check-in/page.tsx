import { AttendanceManager } from '../../../../components/ui/attendance-manager';
import { getReceptionData } from '../../../../lib/reception-data';

export default async function CheckInPage() {
  const data = await getReceptionData();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">ثبت حضور</h1><p className="text-muted">انتخاب عضو، ثبت ورود و مدیریت خروج‌های باز</p></header><AttendanceManager initialRecords={data.records} members={data.members} /></div>;
}
