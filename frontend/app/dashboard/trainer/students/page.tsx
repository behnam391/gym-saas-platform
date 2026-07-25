import { cookies } from 'next/headers';
import { UserRound } from 'lucide-react';
import { api } from '../../../../lib/api';
import { TrainerStudentItem } from '../../../../components/ui/trainer-program-manager';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { Badge } from '../../../../components/ui/badge';

export default async function StudentsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const students = await api.get<TrainerStudentItem[]>('/trainers/students', { accessToken: token }).catch(() => []);
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">شاگردان من</h1><p className="text-muted">فهرست ورزشکاران فعال تحت مربیگری شما</p></header><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{students.map((student) => <MembershipCard key={student.id}><div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-soft"><UserRound className="size-6" /></span><div className="flex-1"><h2 className="font-bold">{student.user.firstName} {student.user.lastName}</h2><p className="text-sm text-muted">{student.user.mobile}</p></div><Badge tone="success">فعال</Badge></div></MembershipCard>)}</div>{!students.length && <MembershipCard className="text-center text-muted">هنوز شاگردی به شما اختصاص داده نشده است.</MembershipCard>}</div>;
}
