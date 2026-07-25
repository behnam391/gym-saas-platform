import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { ManagedMember, MembersTable } from '../../../../components/ui/members-table';

async function getMembers(): Promise<ManagedMember[]> {
  // NOTE: server components can't read sessionStorage (client-only) — in a
  // real app the access token would come from an httpOnly cookie set during
  // login via a Route Handler. Shown here as a placeholder fetch so the
  // page renders meaningfully even with an empty/expired token.
  const token = (await cookies()).get('accessToken')?.value;
  try {
    return await api.get<ManagedMember[]>('/tenants/me/members', { accessToken: token });
  } catch {
    return [];
  }
}

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">اعضای باشگاه</h1>
        <p className="text-muted">مدیریت اعضا و تایید رضایت‌نامه والدین کاربران خردسال</p>
      </header>
      <MembersTable initialMembers={members} />
    </div>
  );
}
