'use client';

import { FormEvent, useState } from 'react';
import {
  Archive,
  CalendarDays,
  Dumbbell,
  Play,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface TrainerStudentItem {
  id: string;
  userId: string;
  user: { firstName: string; lastName: string; mobile: string };
}

interface ExerciseForm {
  name: string;
  sets: string;
  reps: string;
  restSeconds: string;
  notes: string;
}

interface SessionForm {
  dayOfWeek: string;
  title: string;
  exercises: ExerciseForm[];
}

export interface TrainerProgramItem {
  id: string;
  title: string;
  goal: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  athlete?: { user?: { id: string; firstName: string; lastName: string } };
  sessions: {
    id: string;
    title: string;
    exercises: { id: string; name: string }[];
  }[];
}

const newExercise = (): ExerciseForm => ({
  name: '',
  sets: '3',
  reps: '10-12',
  restSeconds: '60',
  notes: '',
});

const newSession = (): SessionForm => ({
  dayOfWeek: '6',
  title: '',
  exercises: [newExercise()],
});

const GOALS: Record<string, string> = {
  FAT_LOSS: 'کاهش چربی',
  MUSCLE_GAIN: 'عضله‌سازی',
  GENERAL_FITNESS: 'تناسب عمومی',
  ENDURANCE: 'استقامت',
  REHABILITATION: 'بازتوانی',
};

const DAYS = [
  { value: '6', label: 'شنبه' },
  { value: '0', label: 'یکشنبه' },
  { value: '1', label: 'دوشنبه' },
  { value: '2', label: 'سه‌شنبه' },
  { value: '3', label: 'چهارشنبه' },
  { value: '4', label: 'پنجشنبه' },
  { value: '5', label: 'جمعه' },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  COMPLETED: 'تکمیل‌شده',
  ARCHIVED: 'بایگانی',
  DRAFT: 'پیش‌نویس',
};

export function TrainerProgramManager({
  students,
  initialPrograms,
}: {
  students: TrainerStudentItem[];
  initialPrograms: TrainerProgramItem[];
}) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [athleteUserId, setAthleteUserId] = useState(students[0]?.userId ?? '');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('GENERAL_FITNESS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessions, setSessions] = useState<SessionForm[]>([newSession()]);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function updateSession(index: number, patch: Partial<SessionForm>) {
    setSessions((items) =>
      items.map((item, position) => (position === index ? { ...item, ...patch } : item)),
    );
  }

  function updateExercise(
    sessionIndex: number,
    exerciseIndex: number,
    patch: Partial<ExerciseForm>,
  ) {
    setSessions((items) =>
      items.map((session, position) =>
        position === sessionIndex
          ? {
              ...session,
              exercises: session.exercises.map((exercise, exercisePosition) =>
                exercisePosition === exerciseIndex ? { ...exercise, ...patch } : exercise,
              ),
            }
          : session,
      ),
    );
  }

  function removeSession(index: number) {
    setSessions((items) => items.filter((_, position) => position !== index));
  }

  function removeExercise(sessionIndex: number, exerciseIndex: number) {
    setSessions((items) =>
      items.map((session, position) =>
        position === sessionIndex
          ? {
              ...session,
              exercises: session.exercises.filter(
                (_, exercisePosition) => exercisePosition !== exerciseIndex,
              ),
            }
          : session,
      ),
    );
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusyId('new');
    setError('');
    try {
      const created = await api.post<TrainerProgramItem>('/programs', {
        athleteUserId,
        title,
        goal,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sessions: sessions.map((session) => ({
          dayOfWeek: Number(session.dayOfWeek),
          title: session.title,
          exercises: session.exercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets ? Number(exercise.sets) : undefined,
            reps: exercise.reps || undefined,
            restSeconds: exercise.restSeconds ? Number(exercise.restSeconds) : undefined,
            notes: exercise.notes || undefined,
          })),
        })),
      });
      setPrograms((items) => [
        created,
        ...items.map((item) =>
          item.status === 'ACTIVE' &&
          item.athlete?.user?.id === created.athlete?.user?.id
            ? { ...item, status: 'ARCHIVED' }
            : item,
        ),
      ]);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setSessions([newSession()]);
      setShowForm(false);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ساخت برنامه انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(programId: string, status: 'ACTIVE' | 'ARCHIVED') {
    setBusyId(programId);
    setError('');
    try {
      await api.patch(`/programs/${programId}/status`, { status });
      setPrograms((items) => {
        const targetAthleteId = items.find((item) => item.id === programId)?.athlete?.user?.id;
        return items.map((item) =>
          item.id === programId
            ? { ...item, status }
            : status === 'ACTIVE' &&
                item.status === 'ACTIVE' &&
                item.athlete?.user?.id === targetAthleteId
              ? { ...item, status: 'ARCHIVED' }
              : item,
        );
      });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت برنامه انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((value) => !value)} disabled={!students.length}>
          <Plus className="size-4" />
          برنامه جدید
        </Button>
      </div>

      {showForm && (
        <MembershipCard>
          <form onSubmit={create} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">ورزشکار</span>
                <select
                  value={athleteUserId}
                  onChange={(event) => setAthleteUserId(event.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-surface px-3">
                  {students.map((student) => (
                    <option key={student.id} value={student.userId}>
                      {student.user.firstName} {student.user.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="عنوان برنامه"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">هدف</span>
                <select
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-surface px-3">
                  {Object.entries(GOALS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <Input
                label="تاریخ شروع"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <Input
                label="تاریخ پایان"
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>

            {sessions.map((session, sessionIndex) => (
              <div
                key={sessionIndex}
                className="rounded-2xl border border-white/10 bg-surface/50 p-4">
                <div className="flex items-end gap-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm">
                      <span className="text-muted">روز تمرین</span>
                      <select
                        value={session.dayOfWeek}
                        onChange={(event) =>
                          updateSession(sessionIndex, { dayOfWeek: event.target.value })
                        }
                        className="h-11 rounded-xl border border-white/10 bg-surface px-3">
                        {DAYS.map((day) => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label="عنوان جلسه"
                      value={session.title}
                      onChange={(event) =>
                        updateSession(sessionIndex, { title: event.target.value })
                      }
                      required
                    />
                  </div>
                  {sessions.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      aria-label="حذف جلسه"
                      onClick={() => removeSession(sessionIndex)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 grid gap-3">
                  {session.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={exerciseIndex}
                      className="grid gap-2 rounded-xl border border-white/5 p-3 lg:grid-cols-[2fr_0.7fr_1fr_1fr_2fr_auto]">
                      <Input
                        label="حرکت"
                        value={exercise.name}
                        onChange={(event) =>
                          updateExercise(sessionIndex, exerciseIndex, {
                            name: event.target.value,
                          })
                        }
                        required
                      />
                      <Input
                        label="ست"
                        type="number"
                        min="1"
                        value={exercise.sets}
                        onChange={(event) =>
                          updateExercise(sessionIndex, exerciseIndex, {
                            sets: event.target.value,
                          })
                        }
                      />
                      <Input
                        label="تکرار"
                        value={exercise.reps}
                        onChange={(event) =>
                          updateExercise(sessionIndex, exerciseIndex, {
                            reps: event.target.value,
                          })
                        }
                      />
                      <Input
                        label="استراحت (ثانیه)"
                        type="number"
                        min="0"
                        value={exercise.restSeconds}
                        onChange={(event) =>
                          updateExercise(sessionIndex, exerciseIndex, {
                            restSeconds: event.target.value,
                          })
                        }
                      />
                      <Input
                        label="توضیح مربی"
                        value={exercise.notes}
                        onChange={(event) =>
                          updateExercise(sessionIndex, exerciseIndex, {
                            notes: event.target.value,
                          })
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="self-end text-danger"
                        disabled={session.exercises.length === 1}
                        aria-label="حذف حرکت"
                        onClick={() => removeExercise(sessionIndex, exerciseIndex)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() =>
                    updateSession(sessionIndex, {
                      exercises: [...session.exercises, newExercise()],
                    })
                  }>
                  <Plus className="size-3.5" />
                  افزودن حرکت
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={() => setSessions((items) => [...items, newSession()])}>
              <Plus className="size-4" />
              افزودن جلسه
            </Button>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button
              type="submit"
              disabled={busyId !== null || !athleteUserId || !sessions.length}>
              ثبت و فعال‌سازی برنامه
            </Button>
          </form>
        </MembershipCard>
      )}

      {!students.length && (
        <MembershipCard className="text-center text-muted">
          <UserRound className="mx-auto mb-3 size-9" />
          ابتدا باید ورزشکاری از طرف باشگاه به شما اختصاص داده شود.
        </MembershipCard>
      )}

      {error && !showForm && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        {programs.map((program) => (
          <MembershipCard
            key={program.id}
            className={program.status === 'ARCHIVED' ? 'opacity-70' : ''}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-accent-soft">
                  {GOALS[program.goal] ?? program.goal}
                </p>
                <h2 className="mt-1 text-lg font-extrabold">{program.title}</h2>
                {program.athlete?.user && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <UserRound className="size-3.5" />
                    {program.athlete.user.firstName} {program.athlete.user.lastName}
                  </p>
                )}
              </div>
              <Badge tone={program.status === 'ACTIVE' ? 'success' : 'muted'}>
                {STATUS_LABELS[program.status] ?? program.status}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
              <span className="flex items-center gap-2">
                <Dumbbell className="size-4" />
                {program.sessions.length.toLocaleString('fa-IR')} جلسه ·{' '}
                {program.sessions
                  .reduce((sum, session) => sum + session.exercises.length, 0)
                  .toLocaleString('fa-IR')}{' '}
                حرکت
              </span>
              {program.endDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-4" />
                  تا {new Intl.DateTimeFormat('fa-IR').format(new Date(program.endDate))}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4"
              disabled={busyId === program.id}
              onClick={() =>
                updateStatus(program.id, program.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE')
              }>
              {program.status === 'ACTIVE' ? (
                <><Archive className="size-3.5" />بایگانی</>
              ) : (
                <><Play className="size-3.5" />فعال‌سازی دوباره</>
              )}
            </Button>
          </MembershipCard>
        ))}
      </div>
    </div>
  );
}
