import { cookies } from 'next/headers';
import { Users, Sparkles, Dumbbell } from 'lucide-react';
import { api } from '../../../lib/api';
import { StatCard } from '../../../components/ui/stat-card';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Badge } from '../../../components/ui/badge';

interface Student {
  id: string;
  user: { firstName: string; lastName: string; mobile: string };
}

async function getStudents(): Promise<Student[]> {
  const token = cookies().get('accessToken')?.value;
  try {
    return await api.get<Student[]>('/trainers/students', { accessToken: token });
  } catch {
    return [];
  }
}

export default async function TrainerOverviewPage() {
  const students = await getStudents();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">نمای کلی مربی</h1>
        <p className="text-muted">شاگردان فعال و پیشنهادهای هوش مصنوعی در انتظار بررسی</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="شاگردان فعال" value={students.length} icon={Users} />
        <StatCard label="برنامه‌های فعال" value="—" icon={Dumbbell} />
        <StatCard label="پیشنهاد AI در انتظار" value="—" icon={Sparkles} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">شاگردان</h2>
        {students.length === 0 ? (
          <MembershipCard className="text-center text-muted">هنوز شاگردی اختصاص نیافته است.</MembershipCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {students.map((s) => (
              <MembershipCard key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{s.user.firstName} {s.user.lastName}</p>
                  <p className="text-sm text-muted">{s.user.mobile}</p>
                </div>
                <Badge tone="success">فعال</Badge>
              </MembershipCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
