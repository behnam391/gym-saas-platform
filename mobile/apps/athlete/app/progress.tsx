import type {
  AthleteProgress,
  BodyMeasurementInput,
  FitnessGoal,
} from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { toLatinDigits } from '@/lib/digits';
import { useSession } from '@/providers/session-provider';

const goalLabels: Record<FitnessGoal, string> = {
  FAT_LOSS: 'کاهش وزن',
  MUSCLE_GAIN: 'عضله‌سازی',
  GENERAL_FITNESS: 'آمادگی عمومی',
  ENDURANCE: 'افزایش استقامت',
  REHABILITATION: 'بازتوانی',
};

const goalOptions = Object.entries(goalLabels) as [FitnessGoal, string][];

type MeasurementForm = {
  weightKg: string;
  waistCm: string;
  chestCm: string;
  bodyFatPercent: string;
};

const emptyMeasurement: MeasurementForm = {
  weightKg: '',
  waistCm: '',
  chestCm: '',
  bodyFatPercent: '',
};

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(toLatinDigits(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function ProgressScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [progress, setProgress] = useState<AthleteProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [measurement, setMeasurement] = useState<MeasurementForm>(emptyMeasurement);
  const [goalType, setGoalType] = useState<FitnessGoal>('GENERAL_FITNESS');
  const [goalValue, setGoalValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      setProgress(await api.getMyProgress());
    } catch {
      setError('اطلاعات پیشرفت دریافت نشد. اتصال اینترنت را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/sign-in');
      return;
    }
    loadProgress();
  }, [loadProgress, session, sessionLoading]);

  const weights = useMemo(
    () =>
      [...(progress?.measurements ?? [])]
        .filter((item) => item.weightKg != null)
        .slice(0, 8)
        .reverse(),
    [progress],
  );

  async function saveMeasurement() {
    const payload: BodyMeasurementInput = {
      weightKg: parseOptionalNumber(measurement.weightKg),
      waistCm: parseOptionalNumber(measurement.waistCm),
      chestCm: parseOptionalNumber(measurement.chestCm),
      bodyFatPercent: parseOptionalNumber(measurement.bodyFatPercent),
    };
    if (!Object.values(payload).some((value) => value !== undefined)) {
      Alert.alert('اندازه‌گیری ناقص', 'حداقل یکی از اندازه‌ها را وارد کنید.');
      return;
    }
    setSaving(true);
    try {
      await api.addMyMeasurement(payload);
      setMeasurement(emptyMeasurement);
      setShowMeasurementForm(false);
      await loadProgress();
      Alert.alert('ثبت شد', 'اندازه‌گیری جدید با موفقیت ذخیره شد.');
    } catch {
      Alert.alert('ثبت نشد', 'مقادیر را بررسی و دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  }

  async function saveGoal() {
    setSaving(true);
    try {
      await api.createMyGoal({
        type: goalType,
        targetValue: parseOptionalNumber(goalValue),
      });
      setGoalValue('');
      setShowGoalForm(false);
      await loadProgress();
      Alert.alert('هدف ثبت شد', 'هدف ورزشی جدید به پرونده شما اضافه شد.');
    } catch {
      Alert.alert('ثبت نشد', 'هدف ورزشی ذخیره نشد؛ دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || (loading && !progress)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.emerald} />
        <Text style={styles.loadingText}>در حال دریافت روند پیشرفت…</Text>
      </View>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={loadProgress}>
      <SectionTitle
        title="روند پیشرفت من"
        hint="وزن، اندازه‌های بدن، حضور و هدف‌های ورزشی"
      />

      {error ? (
        <Surface style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={21} color={Brand.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Surface>
      ) : null}

      <View style={styles.stats}>
        <ProgressStat
          icon="scale-outline"
          value={
            progress?.latestMeasurement?.weightKg != null
              ? `${progress.latestMeasurement.weightKg.toLocaleString('fa-IR')} کیلو`
              : '—'
          }
          label="وزن فعلی"
        />
        <ProgressStat
          icon="trending-up-outline"
          value={
            progress?.weightChangeKg != null
              ? `${progress.weightChangeKg > 0 ? '+' : ''}${progress.weightChangeKg.toLocaleString('fa-IR')}`
              : '—'
          }
          label="تغییر آخر"
        />
      </View>
      <View style={styles.stats}>
        <ProgressStat
          icon="calendar-outline"
          value={(progress?.attendanceLast30Days ?? 0).toLocaleString('fa-IR')}
          label="حضور ۳۰ روز"
        />
        <ProgressStat
          icon="fitness-outline"
          value={(
            (progress?.activePrograms ?? 0) + (progress?.activeDiets ?? 0)
          ).toLocaleString('fa-IR')}
          label="برنامه فعال"
        />
      </View>

      <Surface style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="bar-chart-outline" size={23} color={Brand.emerald} />
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>نمودار تغییر وزن</Text>
            <Text style={styles.cardHint}>آخرین اندازه‌گیری‌های ثبت‌شده</Text>
          </View>
        </View>
        <WeightChart weights={weights} />
      </Surface>

      <View style={styles.sectionActions}>
        <Text style={styles.sectionTitle}>اندازه‌گیری‌های بدن</Text>
        <Pressable
          style={styles.smallButton}
          onPress={() => setShowMeasurementForm((value) => !value)}>
          <Ionicons
            name={showMeasurementForm ? 'close' : 'add'}
            size={17}
            color={Brand.ink}
          />
          <Text style={styles.smallButtonText}>
            {showMeasurementForm ? 'بستن' : 'ثبت جدید'}
          </Text>
        </Pressable>
      </View>

      {showMeasurementForm ? (
        <Surface style={styles.formCard}>
          <View style={styles.formGrid}>
            <FormField
              label="وزن (کیلو)"
              keyboardType="decimal-pad"
              value={measurement.weightKg}
              onChangeText={(value) => setMeasurement((item) => ({ ...item, weightKg: value }))}
              containerStyle={styles.halfField}
            />
            <FormField
              label="دور کمر (سانت)"
              keyboardType="decimal-pad"
              value={measurement.waistCm}
              onChangeText={(value) => setMeasurement((item) => ({ ...item, waistCm: value }))}
              containerStyle={styles.halfField}
            />
            <FormField
              label="دور سینه (سانت)"
              keyboardType="decimal-pad"
              value={measurement.chestCm}
              onChangeText={(value) => setMeasurement((item) => ({ ...item, chestCm: value }))}
              containerStyle={styles.halfField}
            />
            <FormField
              label="درصد چربی"
              keyboardType="decimal-pad"
              value={measurement.bodyFatPercent}
              onChangeText={(value) =>
                setMeasurement((item) => ({ ...item, bodyFatPercent: value }))
              }
              containerStyle={styles.halfField}
            />
          </View>
          <PrimaryButton
            title="ذخیره اندازه‌گیری"
            onPress={saveMeasurement}
            loading={saving}
          />
        </Surface>
      ) : null}

      <Surface style={styles.historyCard}>
        {(progress?.measurements ?? []).slice(0, 6).map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.historyDate}>
              {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
                new Date(item.recordedAt),
              )}
            </Text>
            <View style={styles.historyValues}>
              {item.weightKg != null ? (
                <Text style={styles.historyValue}>وزن {item.weightKg.toLocaleString('fa-IR')}</Text>
              ) : null}
              {item.waistCm != null ? (
                <Text style={styles.historyValue}>کمر {item.waistCm.toLocaleString('fa-IR')}</Text>
              ) : null}
              {item.bodyFatPercent != null ? (
                <Text style={styles.historyValue}>
                  چربی {item.bodyFatPercent.toLocaleString('fa-IR')}٪
                </Text>
              ) : null}
            </View>
          </View>
        ))}
        {!progress?.measurements.length ? (
          <Text style={styles.emptyText}>هنوز اندازه‌گیری ثبت نشده است.</Text>
        ) : null}
      </Surface>

      <View style={styles.sectionActions}>
        <Text style={styles.sectionTitle}>هدف‌های ورزشی</Text>
        <Pressable style={styles.smallButton} onPress={() => setShowGoalForm((value) => !value)}>
          <Ionicons name={showGoalForm ? 'close' : 'add'} size={17} color={Brand.ink} />
          <Text style={styles.smallButtonText}>{showGoalForm ? 'بستن' : 'هدف جدید'}</Text>
        </Pressable>
      </View>

      {showGoalForm ? (
        <Surface style={styles.formCard}>
          <View style={styles.goalOptions}>
            {goalOptions.map(([value, label]) => (
              <Pressable
                key={value}
                style={[styles.goalOption, goalType === value && styles.goalOptionActive]}
                onPress={() => setGoalType(value)}>
                <Text
                  style={[
                    styles.goalOptionText,
                    goalType === value && styles.goalOptionTextActive,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <FormField
            label="مقدار هدف (اختیاری)"
            placeholder="مثلاً وزن هدف: ۷۵"
            keyboardType="decimal-pad"
            value={goalValue}
            onChangeText={setGoalValue}
          />
          <PrimaryButton title="ثبت هدف" onPress={saveGoal} loading={saving} />
        </Surface>
      ) : null}

      <View style={styles.goalsList}>
        {(progress?.goals ?? []).map((goal) => (
          <Surface key={goal.id} style={styles.goalCard}>
            <View style={styles.goalIcon}>
              <Ionicons
                name={goal.achieved ? 'checkmark-circle' : 'flag-outline'}
                size={21}
                color={Brand.emerald}
              />
            </View>
            <View style={styles.goalCopy}>
              <Text style={styles.goalTitle}>{goalLabels[goal.type]}</Text>
              <Text style={styles.goalHint}>
                {goal.achieved
                  ? 'به هدف رسیده‌اید'
                  : goal.targetValue != null
                    ? `مقدار هدف: ${goal.targetValue.toLocaleString('fa-IR')}`
                    : 'در حال پیگیری'}
              </Text>
            </View>
          </Surface>
        ))}
        {!progress?.goals.length ? (
          <Surface><Text style={styles.emptyText}>هنوز هدفی ثبت نشده است.</Text></Surface>
        ) : null}
      </View>
    </Screen>
  );
}

function ProgressStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <Surface style={styles.statCard}>
      <Ionicons name={icon} size={20} color={Brand.emerald} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Surface>
  );
}

function WeightChart({
  weights,
}: {
  weights: NonNullable<AthleteProgress['measurements']>;
}) {
  if (weights.length < 2) {
    return (
      <Text style={styles.emptyText}>
        برای نمایش روند، حداقل دو وزن ثبت کنید.
      </Text>
    );
  }
  const values = weights.map((item) => Number(item.weightKg));
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <View style={styles.chart}>
      {weights.map((item) => {
        const value = Number(item.weightKg);
        const height = max === min ? 70 : 35 + ((value - min) / (max - min)) * 75;
        return (
          <View key={item.id} style={styles.chartColumn}>
            <Text style={styles.chartValue}>{value.toLocaleString('fa-IR')}</Text>
            <View style={[styles.chartBar, { height }]} />
            <Text style={styles.chartDate}>
              {new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(
                new Date(item.recordedAt),
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Brand.surface,
  },
  loadingText: { color: Brand.muted, fontSize: 12 },
  errorCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    borderColor: '#F3CACA',
    backgroundColor: '#FFF7F7',
  },
  errorText: { flex: 1, color: Brand.danger, textAlign: 'right', fontSize: 12 },
  stats: { flexDirection: 'row-reverse', gap: 12 },
  statCard: { flex: 1, alignItems: 'flex-end', gap: 7, padding: 15 },
  statValue: { color: Brand.text, fontSize: 18, fontWeight: '900' },
  statLabel: { color: Brand.muted, fontSize: 10 },
  chartCard: { gap: 20 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  cardHeaderCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  cardTitle: { color: Brand.text, fontWeight: '900', fontSize: 15 },
  cardHint: { color: Brand.muted, fontSize: 10 },
  chart: {
    minHeight: 155,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
    paddingTop: 12,
  },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  chartValue: { color: Brand.text, fontSize: 9, fontWeight: '800' },
  chartBar: {
    width: '72%',
    maxWidth: 34,
    minHeight: 25,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: Brand.emerald,
  },
  chartDate: { color: Brand.muted, fontSize: 8, marginBottom: 5 },
  sectionActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: Brand.text, fontSize: 16, fontWeight: '900' },
  smallButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: Brand.lime,
  },
  smallButtonText: { color: Brand.ink, fontSize: 11, fontWeight: '900' },
  formCard: { gap: 15 },
  formGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  halfField: { width: '48%' },
  historyCard: { padding: 0, overflow: 'hidden' },
  historyItem: {
    padding: 14,
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.line,
  },
  historyDate: { color: Brand.text, fontWeight: '800', fontSize: 11, textAlign: 'right' },
  historyValues: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  historyValue: {
    color: Brand.muted,
    fontSize: 10,
    backgroundColor: Brand.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  emptyText: { color: Brand.muted, textAlign: 'center', fontSize: 12, lineHeight: 20 },
  goalOptions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  goalOption: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.surface,
  },
  goalOptionActive: { borderColor: Brand.emerald, backgroundColor: '#E9F4EC' },
  goalOptionText: { color: Brand.muted, fontSize: 11, fontWeight: '700' },
  goalOptionTextActive: { color: Brand.emerald, fontWeight: '900' },
  goalsList: { gap: 10 },
  goalCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 14 },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  goalCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  goalTitle: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  goalHint: { color: Brand.muted, fontSize: 10 },
});
