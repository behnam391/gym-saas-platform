import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { TenantStaff, TenantStaffManager } from '../../../../components/ui/tenant-staff-manager';

export default async function GymStaffPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const staff = await api.get<TenantStaff[]>('/tenant-staff', { accessToken: token }).catch(() => []);
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">پرسنل و دسترسی‌ها</h1><p className="mt-1 text-muted">ساخت حساب پذیرش، بوفه‌دار، مربی و مشاور تغذیه همین باشگاه</p></header>
      <TenantStaffManager initial={staff} />
    </div>
  );
}
