import { AttendanceManager } from '../../../../components/ui/attendance-manager';
import { getReceptionData } from '../../../../lib/reception-data';

export default async function CheckInPage() {
  const data = await getReceptionData();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">ورود و خروج هوشمند</h1>
        <p className="mt-1 text-muted">
          اسکن گُردیار Pass، ثبت دستی و مشاهده لحظه‌ای حاضرین باشگاه
        </p>
      </header>
      <AttendanceManager initialRecords={data.records} members={data.members} />
    </div>
  );
}
