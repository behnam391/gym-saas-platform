import { cookies } from 'next/headers';
import { api } from './api';
import { AttendanceRecord } from '../components/ui/attendance-manager';
import { ManagedMember } from '../components/ui/members-table';

export async function getReceptionData() {
  const token = (await cookies()).get('accessToken')?.value;
  const [records, members] = await Promise.all([
    api.get<AttendanceRecord[]>('/attendance/recent', { accessToken: token }).catch(() => []),
    api.get<ManagedMember[]>('/tenants/me/members', { accessToken: token }).catch(() => []),
  ]);
  return { records, members };
}
