import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { EmptyState, LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { apiMessage } from '@/lib/format';
import type { NutritionClient, ProRole, TrainerStudent } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

const GOALS = [
  ['FAT_LOSS', 'کاهش وزن'],
  ['MUSCLE_GAIN', 'عضله‌سازی'],
  ['GENERAL_FITNESS', 'تناسب عمومی'],
  ['ENDURANCE', 'استقامت'],
  ['REHABILITATION', 'بازتوانی'],
] as const;

export default function ProfessionalScreen() {
  const { session } = useSession();
  const role = session?.role as ProRole | undefined;
  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [clients, setClients] = useState<NutritionClient[]>([]);
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '',
    goal: 'GENERAL_FITNESS',
    day: '0',
    sessionTitle: '',
    detail: '',
    sets: '3',
    reps: '12',
    calories: '2000',
  });
  const allowed = role === 'TRAINER' || role === 'NUTRITIONIST';

  const load = useCallback(async () => {
    if (!role) return;
    try {
      if (role === 'TRAINER') {
        setStudents(await api.get<TrainerStudent[]>('/trainers/students'));
      } else if (role === 'NUTRITIONIST') {
        setClients(await api.get<NutritionClient[]>('/nutritionists/clients'));
      }
    } catch (reason) {
      Alert.alert('خطا', apiMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) return <Redirect href="/(tabs)" />;
  if (loading) return <LoadingState label="در حال دریافت پرونده‌ها…" />;

  const people =
    role === 'TRAINER'
      ? students.map((item) => ({
          id: item.user.id,
          name: `${item.user.firstName} ${item.user.lastName}`,
          mobile: item.user.mobile,
          meta: 'شاگرد فعال',
        }))
      : clients.map((item) => ({
          id: item.user.id,
          name: `${item.user.firstName} ${item.user.lastName}`,
          mobile: item.user.mobile,
          meta: item.athlete.goals[0]
            ? GOALS.find(([value]) => value === item.athlete.goals[0].type)?.[1] ?? 'هدف ثبت‌شده'
            : 'بدون هدف',
        }));

  async function createPlan() {
    if (!selected || !form.title.trim() || !form.sessionTitle.trim() || !form.detail.trim()) {
      Alert.alert('اطلاعات ناقص', 'فرد، عنوان برنامه و جزئیات برنامه را کامل کنید.');
      return;
    }
    setBusy(true);
    try {
      if (role === 'TRAINER') {
        await api.post('/programs', {
          athleteUserId: selected,
          title: form.title.trim(),
          goal: form.goal,
          sessions: [
            {
              dayOfWeek: Number(form.day),
              title: form.sessionTitle.trim(),
              exercises: form.detail
                .split(/\n|،|,/)
                .map((name) => name.trim())
                .filter(Boolean)
                .map((name) => ({
                  name,
                  sets: Number(form.sets) || 3,
                  reps: form.reps || '12',
                  restSeconds: 60,
                })),
            },
          ],
        });
      } else {
        await api.post('/diet', {
          athleteUserId: selected,
          title: form.title.trim(),
          goal: form.goal,
          dailyCalories: Number(form.calories) || undefined,
          meals: form.detail
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, index) => {
              const [mealTime, ...description] = line.split(':');
              return {
                mealTime: description.length ? mealTime.trim() : `وعده ${index + 1}`,
                description: description.length ? description.join(':').trim() : line,
              };
            }),
        });
      }
      setForm({
        title: '',
        goal: 'GENERAL_FITNESS',
        day: '0',
        sessionTitle: '',
        detail: '',
        sets: '3',
        reps: '12',
        calories: '2000',
      });
      setShowForm(false);
      Alert.alert(
        'برنامه ذخیره شد',
        role === 'TRAINER'
          ? 'برنامه تمرینی به‌صورت پیش‌نویس ساخته شد و قابل فعال‌سازی است.'
          : 'برنامه غذایی به‌صورت پیش‌نویس ساخته شد و قابل فعال‌سازی است.',
      );
    } catch (reason) {
      Alert.alert('برنامه ساخته نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen onRefresh={load}>
      <Card style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons
            name={role === 'TRAINER' ? 'barbell' : 'nutrition'}
            size={28}
            color={Brand.ink}
          />
        </View>
        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>{role === 'TRAINER' ? 'مرکز مربیگری' : 'مرکز مشاوره تغذیه'}</Text>
          <Text style={styles.heroText}>
            {people.length.toLocaleString('fa-IR')} {role === 'TRAINER' ? 'شاگرد فعال' : 'مراجع فعال'}
          </Text>
        </View>
      </Card>

      <Button
        title={
          showForm
            ? 'بستن فرم برنامه'
            : role === 'TRAINER'
              ? 'ساخت برنامه تمرینی'
              : 'ساخت برنامه غذایی'
        }
        icon={showForm ? 'close' : 'add'}
        variant={showForm ? 'secondary' : 'primary'}
        onPress={() => setShowForm((value) => !value)}
      />

      {showForm ? (
        <Card style={styles.form}>
          <Text style={styles.formTitle}>انتخاب {role === 'TRAINER' ? 'شاگرد' : 'مراجع'}</Text>
          <View style={styles.peopleSelect}>
            {people.map((person) => (
              <Pressable
                key={person.id}
                onPress={() => setSelected(person.id)}
                style={[styles.personChoice, selected === person.id && styles.personChoiceActive]}>
                <Ionicons
                  name={selected === person.id ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selected === person.id ? Brand.emerald : Brand.muted}
                />
                <Text style={styles.personChoiceText}>{person.name}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="عنوان برنامه" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          <Text style={styles.label}>هدف برنامه</Text>
          <View style={styles.goals}>
            {GOALS.map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setForm({ ...form, goal: value })}
                style={[styles.goal, form.goal === value && styles.goalActive]}>
                <Text style={[styles.goalText, form.goal === value && styles.goalTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {role === 'TRAINER' ? (
            <>
              <Field
                label="روز هفته (۰ شنبه تا ۶ جمعه)"
                keyboardType="number-pad"
                value={form.day}
                onChangeText={(day) => setForm({ ...form, day })}
              />
              <Field
                label="عنوان جلسه"
                value={form.sessionTitle}
                onChangeText={(sessionTitle) => setForm({ ...form, sessionTitle })}
                placeholder="مثلاً تمرین بالاتنه"
              />
              <Field
                label="حرکت‌ها"
                multiline
                value={form.detail}
                onChangeText={(detail) => setForm({ ...form, detail })}
                placeholder={'هر حرکت را در یک خط بنویسید\nپرس سینه\nقایقی\nنشر جانب'}
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <Field label="تکرار" value={form.reps} onChangeText={(reps) => setForm({ ...form, reps })} />
                </View>
                <View style={styles.half}>
                  <Field label="ست" keyboardType="number-pad" value={form.sets} onChangeText={(sets) => setForm({ ...form, sets })} />
                </View>
              </View>
            </>
          ) : (
            <>
              <Field
                label="عنوان روز/بخش"
                value={form.sessionTitle}
                onChangeText={(sessionTitle) => setForm({ ...form, sessionTitle })}
                placeholder="برنامه روزانه"
              />
              <Field
                label="کالری روزانه"
                keyboardType="number-pad"
                value={form.calories}
                onChangeText={(calories) => setForm({ ...form, calories })}
              />
              <Field
                label="وعده‌های غذایی"
                multiline
                value={form.detail}
                onChangeText={(detail) => setForm({ ...form, detail })}
                placeholder={'هر وعده را در یک خط بنویسید\nصبحانه: تخم مرغ و نان کامل\nناهار: مرغ و برنج'}
              />
            </>
          )}
          <Button
            title={role === 'TRAINER' ? 'ذخیره برنامه تمرینی' : 'ذخیره برنامه غذایی'}
            onPress={createPlan}
            loading={busy}
          />
        </Card>
      ) : null}

      <Text style={styles.listTitle}>{role === 'TRAINER' ? 'شاگردان من' : 'مراجعان من'}</Text>
      {people.length ? (
        people.map((person) => (
          <Card key={person.id} style={styles.person}>
            <Badge tone="success">فعال</Badge>
            <View style={styles.personBody}>
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personMeta}>{person.mobile} · {person.meta}</Text>
            </View>
            <View style={styles.avatar}>
              <Ionicons name="person" size={21} color={Brand.emerald} />
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <EmptyState
            title={role === 'TRAINER' ? 'هنوز شاگردی تخصیص داده نشده است' : 'هنوز مراجعه‌کننده‌ای تخصیص داده نشده است'}
            description="تخصیص فرد از پنل مدیریت باشگاه انجام می‌شود."
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Brand.ink, borderColor: '#1A352B', flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  heroIcon: { width: 55, height: 55, borderRadius: 18, backgroundColor: Brand.lime, alignItems: 'center', justifyContent: 'center' },
  heroBody: { flex: 1, alignItems: 'flex-end' },
  heroTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  heroText: { color: '#AEBDB5', fontSize: 10, marginTop: 4 },
  form: { gap: 12 },
  formTitle: { color: Brand.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  peopleSelect: { gap: 7 },
  personChoice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Brand.line, borderRadius: 12, padding: 10, gap: 8 },
  personChoiceActive: { borderColor: Brand.emerald, backgroundColor: Brand.emeraldSoft },
  personChoiceText: { flex: 1, color: Brand.text, fontSize: 11, fontWeight: '800', textAlign: 'right' },
  label: { color: Brand.text, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  goals: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  goal: { borderRadius: 10, backgroundColor: Brand.surface, paddingHorizontal: 10, paddingVertical: 8 },
  goalActive: { backgroundColor: Brand.lime },
  goalText: { color: Brand.muted, fontSize: 9, fontWeight: '800' },
  goalTextActive: { color: Brand.ink },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  listTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personBody: { flex: 1, alignItems: 'flex-end' },
  personName: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  personMeta: { color: Brand.muted, fontSize: 9, marginTop: 3, textAlign: 'right' },
  avatar: { width: 43, height: 43, borderRadius: 15, backgroundColor: Brand.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
});
