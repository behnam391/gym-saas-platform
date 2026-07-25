'use client';

import { FormEvent, useState } from 'react';
import { Archive, Dumbbell, Plus, UserRound } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

export interface TrainerStudentItem { id: string; userId: string; user: { firstName: string; lastName: string; mobile: string } }
interface ExerciseForm { name: string; sets: string; reps: string; restSeconds: string }
interface SessionForm { dayOfWeek: string; title: string; exercises: ExerciseForm[] }
export interface TrainerProgramItem { id: string; title: string; goal: string; status: string; createdAt: string; sessions: Array<{ id: string; title: string; exercises: Array<{ id: string; name: string }> }>; trainer?: { user?: { firstName: string; lastName: string } } }

const newExercise = (): ExerciseForm => ({ name: '', sets: '3', reps: '10-12', restSeconds: '60' });
const newSession = (): SessionForm => ({ dayOfWeek: '0', title: '', exercises: [newExercise()] });
const GOALS: Record<string, string> = { FAT_LOSS: 'کاهش چربی', MUSCLE_GAIN: 'عضله‌سازی', GENERAL_FITNESS: 'تناسب عمومی', ENDURANCE: 'استقامت', REHABILITATION: 'بازتوانی' };
const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export function TrainerProgramManager({ students, initialPrograms }: { students: TrainerStudentItem[]; initialPrograms: TrainerProgramItem[] }) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [athleteUserId, setAthleteUserId] = useState(students[0]?.userId ?? '');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('GENERAL_FITNESS');
  const [sessions, setSessions] = useState<SessionForm[]>([newSession()]);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function updateSession(index: number, patch: Partial<SessionForm>) { setSessions((items) => items.map((item, position) => position === index ? { ...item, ...patch } : item)); }
  function updateExercise(sessionIndex: number, exerciseIndex: number, patch: Partial<ExerciseForm>) { setSessions((items) => items.map((session, position) => position === sessionIndex ? { ...session, exercises: session.exercises.map((exercise, exercisePosition) => exercisePosition === exerciseIndex ? { ...exercise, ...patch } : exercise) } : session)); }

  async function create(event: FormEvent) {
    event.preventDefault(); setBusyId('new'); setError('');
    try {
      const created = await api.post<TrainerProgramItem>('/programs', { athleteUserId, title, goal, sessions: sessions.map((session) => ({ dayOfWeek: Number(session.dayOfWeek), title: session.title, exercises: session.exercises.map((exercise) => ({ name: exercise.name, sets: Number(exercise.sets), reps: exercise.reps, restSeconds: Number(exercise.restSeconds) })) })) });
      setPrograms((items) => [created, ...items]); setTitle(''); setSessions([newSession()]); setShowForm(false);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'ساخت برنامه انجام نشد.'); }
    finally { setBusyId(null); }
  }

  async function archive(programId: string) {
    setBusyId(programId); setError('');
    try { await api.patch(`/programs/${programId}/status`, { status: 'ARCHIVED' }); setPrograms((items) => items.map((item) => item.id === programId ? { ...item, status: 'ARCHIVED' } : item)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'بایگانی برنامه انجام نشد.'); }
    finally { setBusyId(null); }
  }

  return <div className="flex flex-col gap-5"><div className="flex justify-end"><Button onClick={() => setShowForm((value) => !value)} disabled={!students.length}><Plus className="size-4" />برنامه جدید</Button></div>{showForm && <MembershipCard><form onSubmit={create} className="grid gap-5"><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-sm"><span className="text-muted">ورزشکار</span><select value={athleteUserId} onChange={(event) => setAthleteUserId(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-surface px-3">{students.map((student) => <option key={student.id} value={student.userId}>{student.user.firstName} {student.user.lastName}</option>)}</select></label><Input label="عنوان برنامه" value={title} onChange={(event) => setTitle(event.target.value)} required /><label className="grid gap-1.5 text-sm"><span className="text-muted">هدف</span><select value={goal} onChange={(event) => setGoal(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-surface px-3">{Object.entries(GOALS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>{sessions.map((session, sessionIndex) => <div key={sessionIndex} className="rounded-2xl border border-white/10 bg-surface/50 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm"><span className="text-muted">روز تمرین</span><select value={session.dayOfWeek} onChange={(event) => updateSession(sessionIndex, { dayOfWeek: event.target.value })} className="h-10 rounded-xl border border-white/10 bg-surface px-3">{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><Input label="عنوان جلسه" value={session.title} onChange={(event) => updateSession(sessionIndex, { title: event.target.value })} required /></div><div className="mt-4 grid gap-3">{session.exercises.map((exercise, exerciseIndex) => <div key={exerciseIndex} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr]"><Input label="حرکت" value={exercise.name} onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { name: event.target.value })} required /><Input label="ست" type="number" value={exercise.sets} onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { sets: event.target.value })} /><Input label="تکرار" value={exercise.reps} onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { reps: event.target.value })} /><Input label="استراحت (ثانیه)" type="number" value={exercise.restSeconds} onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { restSeconds: event.target.value })} /></div>)}</div><Button type="button" size="sm" variant="ghost" className="mt-3" onClick={() => updateSession(sessionIndex, { exercises: [...session.exercises, newExercise()] })}><Plus className="size-3.5" />افزودن حرکت</Button></div>)}<Button type="button" variant="secondary" onClick={() => setSessions((items) => [...items, newSession()])}><Plus className="size-4" />افزودن جلسه</Button>{error && <p className="text-sm text-danger">{error}</p>}<Button type="submit" disabled={busyId !== null || !athleteUserId}>ثبت و فعال‌سازی برنامه</Button></form></MembershipCard>}{!students.length && <MembershipCard className="text-center text-muted"><UserRound className="mx-auto mb-3 size-9" />ابتدا باید ورزشکاری به شما اختصاص داده شود.</MembershipCard>}<div className="grid gap-5 md:grid-cols-2">{programs.map((program) => <MembershipCard key={program.id} className={program.status === 'ARCHIVED' ? 'opacity-60' : ''}><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-accent-soft">{GOALS[program.goal] ?? program.goal}</p><h2 className="mt-1 text-lg font-extrabold">{program.title}</h2></div><Badge tone={program.status === 'ACTIVE' ? 'success' : 'muted'}>{program.status === 'ACTIVE' ? 'فعال' : 'بایگانی'}</Badge></div><p className="mt-4 flex items-center gap-2 text-sm text-muted"><Dumbbell className="size-4" />{program.sessions.length.toLocaleString('fa-IR')} جلسه · {program.sessions.reduce((sum, session) => sum + session.exercises.length, 0).toLocaleString('fa-IR')} حرکت</p>{program.status === 'ACTIVE' && <Button size="sm" variant="secondary" className="mt-4" disabled={busyId === program.id} onClick={() => archive(program.id)}><Archive className="size-3.5" />بایگانی</Button>}</MembershipCard>)}</div></div>;
}
