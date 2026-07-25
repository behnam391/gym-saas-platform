import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { PlatformUser, PlatformUsersManager } from '../../../../components/ui/platform-users-manager';

interface UsersResponse {
  items: PlatformUser[];
  total: number;
  activeCount: number;
  restrictedCount: number;
}

export default async function PlatformUsersPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const data = await api.get<UsersResponse>('/super-admin/users', { accessToken: token });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت کاربران</h1>
        <p className="mt-1 text-muted">جست‌وجو، فیلتر نقش و کنترل دسترسی کاربران تمام باشگاه‌ها</p>
      </header>
      <PlatformUsersManager initialUsers={data.items} />
    </div>
  );
}
