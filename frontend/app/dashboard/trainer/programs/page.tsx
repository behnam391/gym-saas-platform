import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { TrainerProgramItem, TrainerProgramManager, TrainerStudentItem } from '../../../../components/ui/trainer-program-manager';

async function getData() {
  const token = (await cookies()).get('accessToken')?.value;
  const students = await api.get<TrainerStudentItem[]>('/trainers/students', { accessToken: token }).catch(() => []);
  const programLists = await Promise.all(students.map((student) => api.get<TrainerProgramItem[]>(`/programs/athlete/${student.userId}`, { accessToken: token }).catch(() => [])));
  const programs = [...new Map(programLists.flat().map((program) => [program.id, program])).values()];
  return { students, programs };
}

export default async function ProgramsPage() {
  const data = await getData();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">برنامه‌های تمرینی</h1><p className="text-muted">ساخت برنامه حرفه‌ای و مدیریت نسخه فعال ورزشکاران</p></header><TrainerProgramManager students={data.students} initialPrograms={data.programs} /></div>;
}
