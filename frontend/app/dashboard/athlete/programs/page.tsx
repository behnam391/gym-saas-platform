import { cookies } from 'next/headers';
import { CalendarDays, CheckCircle2, Dumbbell } from 'lucide-react';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { Badge } from '../../../../components/ui/badge';

interface Profile { id: string }
interface Exercise { id: string; name: string; sets?: number | null; reps?: string | null; restSeconds?: number | null; notes?: string | null }
interface Session { id: string; dayOfWeek: number; title: string; exercises: Exercise[] }
interface Program {
  id: string;
  title: string;
  goal: string;
  status: string;
  trainer?: { user?: { firstName: string; lastName: string } };
  sessions: Session[];
}

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

async function getPrograms() {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    const profile = await api.get<Profile>('/athletes/me/profile', { accessToken: token });
    return await api.get<Program[]>(`/programs/athlete/${profile.id}`, { accessToken: token });
  } catch {
    return [];
  }
}

export default async function AthleteProgramsPage() {
  const programs = await getPrograms();
  const active = programs.find((program) => program.status === 'ACTIVE') ?? programs[0];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">برنامه تمرینی من</h1>
        <p className="text-muted">برنامه تأییدشده توسط مربی و جزئیات جلسات هفتگی</p>
      </header>

      {!active ? (
        <MembershipCard className="text-center">
          <Dumbbell className="mx-auto size-10 text-accent-soft" />
          <h2 className="mt-3 text-lg font-bold">هنوز برنامه‌ای برای شما ثبت نشده است</h2>
          <p className="mt-1 text-sm text-muted">پس از تخصیص مربی، برنامه تمرینی اینجا نمایش داده می‌شود.</p>
        </MembershipCard>
      ) : (
        <>
          <MembershipCard>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><Badge tone="success">فعال</Badge><span className="text-sm text-muted">هدف: {active.goal}</span></div>
                <h2 className="mt-3 text-xl font-extrabold">{active.title}</h2>
                <p className="mt-1 text-sm text-muted">مربی: {active.trainer?.user ? `${active.trainer.user.firstName} ${active.trainer.user.lastName}` : 'تعیین نشده'}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted"><CalendarDays className="size-4" />{active.sessions.length.toLocaleString('fa-IR')} جلسه در هفته</div>
            </div>
          </MembershipCard>

          <div className="grid gap-5 lg:grid-cols-2">
            {active.sessions.map((session) => (
              <MembershipCard key={session.id}>
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs text-accent-soft">{DAYS[session.dayOfWeek] ?? `روز ${session.dayOfWeek}`}</p><h3 className="text-lg font-bold">{session.title}</h3></div>
                  <Dumbbell className="size-6 text-accent-soft" />
                </div>
                <div className="mt-4 divide-y divide-white/10">
                  {session.exercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{exercise.name}</span><span className="text-sm text-muted">{exercise.sets ?? '—'} ست × {exercise.reps ?? '—'}</span></div>
                        {(exercise.restSeconds || exercise.notes) && <p className="mt-1 text-xs text-muted">{exercise.restSeconds ? `استراحت ${exercise.restSeconds} ثانیه` : ''}{exercise.restSeconds && exercise.notes ? ' · ' : ''}{exercise.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </MembershipCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
