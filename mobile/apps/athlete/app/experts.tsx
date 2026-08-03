import type {
  ConsultationRequest,
  PlatformProfessional,
} from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

type Filter = 'ALL' | 'TRAINER' | 'NUTRITIONIST';

const statusLabel: Record<ConsultationRequest['status'], string> = {
  REQUESTED: 'در انتظار بررسی',
  CONTACTED: 'تماس گرفته شد',
  CONFIRMED: 'تأیید شده',
  COMPLETED: 'انجام شده',
  CANCELLED: 'لغو شده',
};

const modeLabel: Record<PlatformProfessional['serviceMode'], string> = {
  ONLINE: 'آنلاین',
  IN_PERSON: 'حضوری',
  HYBRID: 'آنلاین و حضوری',
};

function buildConsultationSlot(daysFromNow: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return {
    value: date.toISOString(),
    label: new Intl.DateTimeFormat('fa-IR', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  };
}

export default function ExpertsScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [professionals, setProfessionals] = useState<PlatformProfessional[]>([]);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [nextProfessionals, nextRequests] = await Promise.all([
        api.getPlatformProfessionals(),
        api.getMyConsultationRequests(),
      ]);
      setProfessionals(nextProfessionals);
      setRequests(nextRequests);
    } catch {
      setError('فهرست متخصصان دریافت نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/sign-in');
      return;
    }
    load();
  }, [load, session, sessionLoading]);

  const visible = useMemo(
    () => filter === 'ALL'
      ? professionals
      : professionals.filter((item) => item.type === filter),
    [filter, professionals],
  );
  const consultationSlots = useMemo(
    () => [
      buildConsultationSlot(1, 10),
      buildConsultationSlot(1, 15),
      buildConsultationSlot(1, 19),
      buildConsultationSlot(2, 18),
    ],
    [],
  );

  async function submit(item: PlatformProfessional) {
    setSubmittingId(item.id);
    setError(null);
    try {
      const created = await api.requestConsultation(item.id, {
        message: notes[item.id]?.trim() || undefined,
        preferredAt: selectedSlots[item.id] || undefined,
      });
      setRequests((current) => [created, ...current]);
      setNotes((current) => ({ ...current, [item.id]: '' }));
      setSelectedSlots((current) => ({ ...current, [item.id]: '' }));
      Alert.alert('درخواست ثبت شد', `درخواست مشاوره با ${item.fullName} ثبت شد.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ثبت درخواست انجام نشد.');
    } finally {
      setSubmittingId(null);
    }
  }

  if (sessionLoading || (loading && !professionals.length)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.emerald} />
        <Text style={styles.muted}>در حال دریافت متخصصان…</Text>
      </View>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={load}>
      <SectionTitle
        title="مربیان و مشاوران سراسری"
        hint="متخصصان تأییدشده گردیار برای مشاوره آنلاین و حضوری"
      />

      <View style={styles.filters}>
        <FilterButton active={filter === 'ALL'} title="همه" onPress={() => setFilter('ALL')} />
        <FilterButton active={filter === 'TRAINER'} title="مربیان" onPress={() => setFilter('TRAINER')} />
        <FilterButton active={filter === 'NUTRITIONIST'} title="تغذیه" onPress={() => setFilter('NUTRITIONIST')} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {requests.length ? (
        <Surface style={styles.historyCard}>
          <View style={styles.historyHeading}>
            <Text style={styles.historyTitle}>پیگیری درخواست‌های من</Text>
            <Text style={styles.historyCount}>
              {requests.length.toLocaleString('fa-IR')} درخواست
            </Text>
          </View>
          {requests.slice(0, 5).map((request) => (
            <View key={request.id} style={styles.historyRow}>
              <View style={styles.historyCopy}>
                <Text style={styles.historyName}>{request.professional.fullName}</Text>
                <Text style={styles.historyMeta}>
                  {new Intl.DateTimeFormat('fa-IR', {
                    dateStyle: 'medium',
                  }).format(new Date(request.createdAt))}
                  {request.preferredAt
                    ? ` · زمان پیشنهادی ${new Intl.DateTimeFormat('fa-IR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(request.preferredAt))}`
                    : ''}
                </Text>
              </View>
              <Text style={styles.historyStatus}>{statusLabel[request.status]}</Text>
            </View>
          ))}
        </Surface>
      ) : null}

      {visible.map((item) => {
        const openRequest = requests.find(
          (request) =>
            request.professionalId === item.id &&
            ['REQUESTED', 'CONTACTED', 'CONFIRMED'].includes(request.status),
        );
        return (
          <Surface key={item.id} style={styles.card}>
            <View style={styles.header}>
              {item.profileImageUrl ? (
                <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons
                    name={item.type === 'TRAINER' ? 'barbell' : 'nutrition'}
                    size={25}
                    color={Brand.emerald}
                  />
                </View>
              )}
              <View style={styles.headerCopy}>
                <Text style={styles.kind}>
                  {item.type === 'TRAINER' ? 'مربی منتخب سراسری' : 'مشاور تغذیه منتخب'}
                </Text>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.meta}>
                  ★ {Number(item.rating).toLocaleString('fa-IR')} · {modeLabel[item.serviceMode]}
                  {item.city ? ` · ${item.city}` : ''}
                </Text>
              </View>
            </View>

            {item.bio ? <Text style={styles.bio}>{item.bio}</Text> : null}
            <View style={styles.tags}>
              {item.specialties.map((specialty) => (
                <Text key={specialty} style={styles.tag}>{specialty}</Text>
              ))}
            </View>

            {openRequest ? (
              <>
                <View style={styles.requestStatus}>
                  <Ionicons name="checkmark-circle" size={18} color={Brand.emerald} />
                  <Text style={styles.requestStatusText}>{statusLabel[openRequest.status]}</Text>
                </View>
                {openRequest.preferredAt ? (
                  <Text style={styles.preferredTime}>
                    زمان پیشنهادی شما: {new Intl.DateTimeFormat('fa-IR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(openRequest.preferredAt))}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>زمان مناسب برای تماس</Text>
                <View style={styles.slots}>
                  {consultationSlots.map((slot) => {
                    const selected = selectedSlots[item.id] === slot.value;
                    return (
                      <Pressable
                        key={slot.value}
                        onPress={() =>
                          setSelectedSlots((current) => ({
                            ...current,
                            [item.id]: selected ? '' : slot.value,
                          }))
                        }
                        style={[styles.slot, selected && styles.slotSelected]}>
                        <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                          {slot.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={notes[item.id] ?? ''}
                  onChangeText={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
                  placeholder="هدف یا زمان مناسب برای تماس (اختیاری)"
                  placeholderTextColor={Brand.muted}
                  multiline
                  style={styles.input}
                  textAlign="right"
                />
                <View style={styles.footer}>
                  <Text style={styles.fee}>
                    {item.consultationFee
                      ? `${Number(item.consultationFee).toLocaleString('fa-IR')} تومان`
                      : 'هزینه توافقی'}
                  </Text>
                  <Pressable
                    disabled={submittingId === item.id}
                    onPress={() => submit(item)}
                    style={styles.button}>
                    {submittingId === item.id
                      ? <ActivityIndicator size="small" color={Brand.ink} />
                      : <Text style={styles.buttonText}>درخواست مشاوره</Text>}
                  </Pressable>
                </View>
              </>
            )}
          </Surface>
        );
      })}

      {!visible.length ? (
        <Surface style={styles.empty}>
          <Ionicons name="people-outline" size={34} color={Brand.muted} />
          <Text style={styles.muted}>هنوز متخصص فعالی در این گروه ثبت نشده است.</Text>
        </Surface>
      ) : null}
    </Screen>
  );
}

function FilterButton({
  active,
  title,
  onPress,
}: {
  active: boolean;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filter, active && styles.filterActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Brand.surface },
  muted: { color: Brand.muted, fontSize: 12, textAlign: 'center' },
  filters: { flexDirection: 'row-reverse', gap: 8 },
  filter: { flex: 1, minHeight: 42, borderRadius: 13, backgroundColor: Brand.card, borderWidth: 1, borderColor: Brand.line, alignItems: 'center', justifyContent: 'center' },
  filterActive: { backgroundColor: Brand.lime, borderColor: Brand.lime },
  filterText: { color: Brand.muted, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: Brand.ink },
  error: { color: Brand.danger, backgroundColor: '#FFF4F4', borderRadius: 14, padding: 12, textAlign: 'right' },
  historyCard: { gap: 0, paddingVertical: 6 },
  historyHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  historyTitle: { color: Brand.text, fontSize: 14, fontWeight: '900' },
  historyCount: { color: Brand.muted, fontSize: 10 },
  historyRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.line, paddingVertical: 12 },
  historyCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  historyName: { color: Brand.text, fontSize: 12, fontWeight: '900' },
  historyMeta: { color: Brand.muted, fontSize: 9, textAlign: 'right' },
  historyStatus: { color: Brand.emerald, backgroundColor: '#EAF5ED', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontSize: 9, fontWeight: '900' },
  card: { gap: 14 },
  header: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  avatar: { width: 68, height: 68, borderRadius: 20 },
  avatarFallback: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#E9F4EC', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  kind: { color: Brand.emerald, fontSize: 10, fontWeight: '900' },
  name: { color: Brand.text, fontSize: 17, fontWeight: '900' },
  meta: { color: Brand.muted, fontSize: 11, textAlign: 'right' },
  bio: { color: Brand.muted, fontSize: 12, lineHeight: 21, textAlign: 'right' },
  tags: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  tag: { color: Brand.text, backgroundColor: Brand.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 10 },
  fieldLabel: { color: Brand.text, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  slots: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  slot: { borderWidth: 1, borderColor: Brand.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: Brand.surface },
  slotSelected: { borderColor: Brand.emerald, backgroundColor: '#E9F4EC' },
  slotText: { color: Brand.muted, fontSize: 10, fontWeight: '700' },
  slotTextSelected: { color: Brand.emerald, fontWeight: '900' },
  input: { minHeight: 72, borderRadius: 15, borderWidth: 1, borderColor: Brand.line, backgroundColor: Brand.surface, color: Brand.text, padding: 12, fontSize: 12, textAlignVertical: 'top' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  fee: { color: Brand.text, fontSize: 12, fontWeight: '900' },
  button: { minWidth: 135, minHeight: 43, borderRadius: 13, backgroundColor: Brand.lime, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  buttonText: { color: Brand.ink, fontSize: 12, fontWeight: '900' },
  requestStatus: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, backgroundColor: '#EAF5ED', borderRadius: 14, padding: 12 },
  requestStatusText: { color: Brand.emerald, fontSize: 12, fontWeight: '900' },
  preferredTime: { color: Brand.muted, fontSize: 10, textAlign: 'right' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
});
