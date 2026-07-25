import { MembersTable } from '../../../../components/ui/members-table';
import { getReceptionData } from '../../../../lib/reception-data';

export default async function ReceptionMembersPage() {
  const data = await getReceptionData();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">اعضای باشگاه</h1><p className="text-muted">بررسی بیمه، رضایت‌نامه و ثبت پرداخت حضوری اعضا</p></header><MembersTable initialMembers={data.members} /></div>;
}
