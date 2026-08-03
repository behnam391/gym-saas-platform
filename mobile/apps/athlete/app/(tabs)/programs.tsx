import type {
  DietPlan,
  FitnessGoal,
  ProgramStatus,
  TrainingProgram,
} from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

type ProgramTab = 'training' | 'diet';

const weekDays = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
];

const goalLabels: Record<FitnessGoal, string> = {
  FAT_LOSS: 'کاهش وزن',
  MUSCLE_GAIN: 'عضله‌سازی',
  GENERAL_FITNESS: 'آمادگی عمومی',
  ENDURANCE: 'افزایش استقامت',
  REHABILITATION: 'بازتوانی',
};

const statusLabels: Record<ProgramStatus, string> = {
  DRAFT: 'پیش‌نویس',
  ACTIVE: 'فعال',
  COMPLETED: 'تکمیل‌شده',
  ARCHIVED: 'بایگانی‌شده',
};

function sortCurrentFirst<T extends { status: ProgramStatus; createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function ProgramsScreen() {
  const { session } = useSession();
  const [tab, setTab] = useState<ProgramTab>('training');
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [programs, diets] = await Promise.all([
        api.getMyTrainingPrograms(),
        api.getMyDietPlans(),
      ]);
      setTrainingPrograms(sortCurrentFirst(programs));
      setDietPlans(sortCurrentFirst(diets));
    } catch {
      setLoadError(
        'برنامه‌ها دریافت نشد. اگر به‌تازگی عضو باشگاه شده‌اید، یک‌بار از حساب خارج و دوباره وارد شوید.',
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const activeTraining = trainingPrograms[0] ?? null;
  const activeDiet = dietPlans[0] ?? null;
  const todaySession = useMemo(
    () => activeTraining?.sessions.find((item) => item.dayOfWeek === new Date().getDay()),
    [activeTraining],
  );

  if (!session) {
    return (
      <Screen header={<BrandHeader />}>
        <SectionTitle
          title="برنامه‌های من"
          hint="تمرین و تغذیه در یک مسیر منظم"
        />
        <GuestState />
      </Screen>
    );
  }

  return (
    <Screen
      header={<BrandHeader />}
      refreshing={loading}
      onRefresh={loadPrograms}>
      <SectionTitle
        title="برنامه‌های من"
        hint="نسخه تأییدشده مربی و مشاور تغذیه"
      />

      <View style={styles.tabs}>
        <TabButton
          active={tab === 'training'}
          icon="barbell-outline"
          title="تمرین"
          count={trainingPrograms.length}
          onPress={() => setTab('training')}
        />
        <TabButton
          active={tab === 'diet'}
          icon="nutrition-outline"
          title="تغذیه"
          count={dietPlans.length}
          onPress={() => setTab('diet')}
        />
      </View>

      {loading && !trainingPrograms.length && !dietPlans.length ? (
        <Surface style={styles.loadingCard}>
          <ActivityIndicator color={Brand.emerald} size="large" />
          <Text style={styles.loadingText}>در حال دریافت برنامه‌های شما…</Text>
        </Surface>
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={loadPrograms} />
      ) : tab === 'training' ? (
        activeTraining ? (
          <>
            <TrainingOverview program={activeTraining} todaySessionId={todaySession?.id} />
            {trainingPrograms.length > 1 ? (
              <PlanHistory
                title="برنامه‌های تمرینی قبلی"
                items={trainingPrograms.slice(1)}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="barbell-outline"
            title="هنوز برنامه تمرینی ندارید"
            text="پس از ثبت برنامه توسط مربی تأییدشده، جلسه‌ها و حرکات شما اینجا نمایش داده می‌شود."
          />
        )
      ) : activeDiet ? (
        <>
          <DietOverview plan={activeDiet} />
          {dietPlans.length > 1 ? (
            <PlanHistory
              title="برنامه‌های غذایی قبلی"
              items={dietPlans.slice(1)}
            />
          ) : null}
        </>
      ) : (
        <EmptyState
          icon="nutrition-outline"
          title="هنوز برنامه غذایی ندارید"
          text="پس از ثبت رژیم توسط مشاور تغذیه تأییدشده، وعده‌ها و کالری روزانه اینجا نمایش داده می‌شود."
        />
      )}

      <Link href={'/experts' as Href} asChild>
        <Pressable style={styles.consultation}>
          <View style={styles.consultationIcon}>
            <Ionicons name="chatbubbles-outline" size={23} color={Brand.emerald} />
          </View>
          <View style={styles.consultationCopy}>
            <Text style={styles.consultationTitle}>مشاوره با متخصصان سراسری</Text>
            <Text style={styles.consultationText}>
              مربی یا مشاور تغذیه را انتخاب و درخواست مشاوره ثبت کنید.
            </Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={Brand.muted} />
        </Pressable>
      </Link>
    </Screen>
  );
}

function GuestState() {
  return (
    <Surface style={styles.guest}>
      <View style={styles.heroIcon}>
        <Ionicons name="fitness" size={30} color={Brand.emerald} />
      </View>
      <Text style={styles.guestTitle}>برنامه شخصی شما پس از ورود نمایش داده می‌شود</Text>
      <Text style={styles.guestText}>
        برنامه‌های تأییدشده مربی و مشاور تغذیه همیشه در حساب ورزشی شما نگهداری می‌شود.
      </Text>
      <Link href="/sign-in" asChild>
        <Pressable style={styles.loginButton}>
          <Text style={styles.loginButtonText}>ورود به حساب ورزشکار</Text>
        </Pressable>
      </Link>
    </Surface>
  );
}

function TabButton({
  active,
  icon,
  title,
  count,
  onPress,
}: {
  active: boolean;
  icon: 'barbell-outline' | 'nutrition-outline';
  title: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? Brand.ink : Brand.muted} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
      <View style={[styles.countBadge, active && styles.countBadgeActive]}>
        <Text style={styles.countText}>{count.toLocaleString('fa-IR')}</Text>
      </View>
    </Pressable>
  );
}

function TrainingOverview({
  program,
  todaySessionId,
}: {
  program: TrainingProgram;
  todaySessionId?: string;
}) {
  const trainerName = `${program.trainer.user.firstName} ${program.trainer.user.lastName}`;

  return (
    <>
      <PlanHeader
        icon="barbell"
        title={program.title}
        professionalLabel="مربی"
        professionalName={trainerName}
        goal={program.goal}
        status={program.status}
      />

      {program.sessions.map((session) => {
        const isToday = session.id === todaySessionId;
        return (
          <Surface key={session.id} style={[styles.sessionCard, isToday && styles.todayCard]}>
            <View style={styles.sessionHeader}>
              <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
                <Text style={[styles.dayText, isToday && styles.dayTextToday]}>
                  {isToday ? 'امروز' : weekDays[session.dayOfWeek] ?? `روز ${session.dayOfWeek}`}
                </Text>
              </View>
              <View style={styles.sessionCopy}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionMeta}>
                  {session.exercises.length.toLocaleString('fa-IR')} حرکت
                </Text>
              </View>
            </View>

            {session.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exercise}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>
                    {(index + 1).toLocaleString('fa-IR')}
                  </Text>
                </View>
                <View style={styles.exerciseCopy}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMetaRow}>
                    {exercise.sets ? (
                      <Text style={styles.exerciseMeta}>
                        {exercise.sets.toLocaleString('fa-IR')} ست
                      </Text>
                    ) : null}
                    {exercise.reps ? (
                      <Text style={styles.exerciseMeta}>تکرار {exercise.reps}</Text>
                    ) : null}
                    {exercise.restSeconds ? (
                      <Text style={styles.exerciseMeta}>
                        استراحت {exercise.restSeconds.toLocaleString('fa-IR')} ثانیه
                      </Text>
                    ) : null}
                  </View>
                  {exercise.notes ? (
                    <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Surface>
        );
      })}
    </>
  );
}

function DietOverview({ plan }: { plan: DietPlan }) {
  const nutritionistName =
    `${plan.nutritionist.user.firstName} ${plan.nutritionist.user.lastName}`;

  return (
    <>
      <PlanHeader
        icon="nutrition"
        title={plan.title}
        professionalLabel="مشاور تغذیه"
        professionalName={nutritionistName}
        goal={plan.goal}
        status={plan.status}
        extra={
          plan.dailyCalories
            ? `${plan.dailyCalories.toLocaleString('fa-IR')} کالری روزانه`
            : undefined
        }
      />

      <Surface style={styles.mealsCard}>
        <View style={styles.mealsHeader}>
          <Ionicons name="restaurant-outline" size={22} color={Brand.emerald} />
          <Text style={styles.mealsTitle}>وعده‌های روزانه</Text>
        </View>
        {plan.meals.map((meal) => (
          <View key={meal.id} style={styles.meal}>
            <View style={styles.mealTop}>
              {meal.calories ? (
                <Text style={styles.mealCalories}>
                  {meal.calories.toLocaleString('fa-IR')} کالری
                </Text>
              ) : <View />}
              <Text style={styles.mealTime}>{meal.mealTime}</Text>
            </View>
            <Text style={styles.mealDescription}>{meal.description}</Text>
          </View>
        ))}
      </Surface>
    </>
  );
}

function PlanHeader({
  icon,
  title,
  professionalLabel,
  professionalName,
  goal,
  status,
  extra,
}: {
  icon: 'barbell' | 'nutrition';
  title: string;
  professionalLabel: string;
  professionalName: string;
  goal?: FitnessGoal | null;
  status: ProgramStatus;
  extra?: string;
}) {
  const isActive = status === 'ACTIVE';

  return (
    <Surface style={styles.planHeader}>
      <View style={styles.planTop}>
        <View style={styles.planIcon}>
          <Ionicons name={icon} size={25} color={Brand.emerald} />
        </View>
        <View style={styles.planCopy}>
          <Text style={styles.planTitle}>{title}</Text>
          <Text style={styles.professional}>
            {professionalLabel}: {professionalName}
          </Text>
        </View>
        <View style={[styles.statusBadge, !isActive && styles.statusBadgeMuted]}>
          <Text style={[styles.statusText, !isActive && styles.statusTextMuted]}>
            {statusLabels[status]}
          </Text>
        </View>
      </View>
      <View style={styles.planMeta}>
        {goal ? <MetaPill icon="flag-outline" text={goalLabels[goal]} /> : null}
        {extra ? <MetaPill icon="flame-outline" text={extra} /> : null}
      </View>
    </Surface>
  );
}

function MetaPill({
  icon,
  text,
}: {
  icon: 'flag-outline' | 'flame-outline';
  text: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={15} color={Brand.emerald} />
      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

function PlanHistory({
  title,
  items,
}: {
  title: string;
  items: { id: string; title: string; status: ProgramStatus; createdAt: string }[];
}) {
  return (
    <Surface style={styles.history}>
      <Text style={styles.historyTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.historyItem}>
          <Text style={styles.historyDate}>
            {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
              new Date(item.createdAt),
            )}
          </Text>
          <View style={styles.historyCopy}>
            <Text style={styles.historyName}>{item.title}</Text>
            <Text style={styles.historyStatus}>{statusLabels[item.status]}</Text>
          </View>
        </View>
      ))}
    </Surface>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: 'barbell-outline' | 'nutrition-outline';
  title: string;
  text: string;
}) {
  return (
    <Surface style={styles.empty}>
      <View style={styles.heroIcon}>
        <Ionicons name={icon} size={29} color={Brand.emerald} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </Surface>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Surface style={styles.errorCard}>
      <Ionicons name="cloud-offline-outline" size={29} color={Brand.danger} />
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>تلاش دوباره</Text>
      </Pressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  guest: { alignItems: 'center', gap: 11, paddingVertical: 24 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  guestTitle: { color: Brand.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  guestText: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 310,
  },
  loginButton: {
    marginTop: 7,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: Brand.lime,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: { color: Brand.ink, fontWeight: '900' },
  tabs: {
    flexDirection: 'row-reverse',
    gap: 10,
    padding: 5,
    borderRadius: 18,
    backgroundColor: '#E9EDE5',
  },
  tab: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  tabActive: { backgroundColor: Brand.lime },
  tabText: { color: Brand.muted, fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: Brand.ink, fontWeight: '900' },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7DED2',
  },
  countBadgeActive: { backgroundColor: 'rgba(7,17,14,0.12)' },
  countText: { color: Brand.ink, fontSize: 10, fontWeight: '900' },
  loadingCard: { alignItems: 'center', gap: 12, paddingVertical: 35 },
  loadingText: { color: Brand.muted, fontSize: 12 },
  planHeader: { gap: 15, borderColor: '#BFD7C7' },
  planTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  planIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  planCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  planTitle: { color: Brand.text, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  professional: { color: Brand.muted, fontSize: 11, textAlign: 'right' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E9F4EC',
  },
  statusBadgeMuted: { backgroundColor: '#EEF0EC' },
  statusText: { color: Brand.emerald, fontSize: 10, fontWeight: '900' },
  statusTextMuted: { color: Brand.muted },
  planMeta: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  metaPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: Brand.surface,
    borderRadius: 12,
  },
  metaPillText: { color: Brand.text, fontSize: 11, fontWeight: '700' },
  sessionCard: { padding: 0, overflow: 'hidden' },
  todayCard: { borderColor: Brand.limeDark, borderWidth: 2 },
  sessionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    backgroundColor: '#F7F9F4',
  },
  sessionCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  sessionTitle: { color: Brand.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  sessionMeta: { color: Brand.muted, fontSize: 10 },
  dayBadge: {
    borderRadius: 999,
    backgroundColor: '#E9EDE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayBadgeToday: { backgroundColor: Brand.lime },
  dayText: { color: Brand.muted, fontSize: 10, fontWeight: '800' },
  dayTextToday: { color: Brand.ink },
  exercise: {
    flexDirection: 'row-reverse',
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.line,
  },
  exerciseNumber: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  exerciseNumberText: { color: Brand.emerald, fontWeight: '900', fontSize: 11 },
  exerciseCopy: { flex: 1, alignItems: 'flex-end', gap: 7 },
  exerciseName: { color: Brand.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  exerciseMetaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  exerciseMeta: {
    color: Brand.muted,
    backgroundColor: Brand.surface,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 10,
  },
  exerciseNotes: { color: Brand.muted, fontSize: 11, lineHeight: 18, textAlign: 'right' },
  mealsCard: { gap: 0, padding: 0, overflow: 'hidden' },
  mealsHeader: {
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#F7F9F4',
  },
  mealsTitle: { flex: 1, color: Brand.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  meal: {
    gap: 8,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.line,
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTime: { color: Brand.emerald, fontSize: 13, fontWeight: '900' },
  mealCalories: { color: Brand.muted, fontSize: 10 },
  mealDescription: { color: Brand.text, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  history: { gap: 12 },
  historyTitle: { color: Brand.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.line,
  },
  historyDate: { color: Brand.muted, fontSize: 10 },
  historyCopy: { alignItems: 'flex-end', gap: 4 },
  historyName: { color: Brand.text, fontSize: 12, fontWeight: '800' },
  historyStatus: { color: Brand.muted, fontSize: 10 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyText: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 310,
  },
  errorCard: {
    alignItems: 'center',
    gap: 12,
    borderColor: '#F3CACA',
    backgroundColor: '#FFF7F7',
  },
  errorText: { color: Brand.danger, textAlign: 'center', fontSize: 12, lineHeight: 20 },
  retryButton: {
    borderRadius: 12,
    backgroundColor: Brand.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  consultation: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Brand.card,
    borderColor: Brand.line,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  consultationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultationCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  consultationTitle: { color: Brand.text, fontWeight: '900', fontSize: 14 },
  consultationText: { color: Brand.muted, fontSize: 11, textAlign: 'right', lineHeight: 18 },
});
