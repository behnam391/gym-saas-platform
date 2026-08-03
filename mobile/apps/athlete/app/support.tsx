import type {
  AthleteTicket,
  TicketPriority,
  TicketStatus,
} from '@gordyar/mobile-core';
import { ApiError } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

const statusLabel: Record<TicketStatus, string> = {
  OPEN: 'باز',
  IN_PROGRESS: 'در حال بررسی',
  RESOLVED: 'حل‌شده',
  CLOSED: 'بسته‌شده',
};

const priorityLabel: Record<TicketPriority, string> = {
  LOW: 'عادی',
  MEDIUM: 'متوسط',
  HIGH: 'مهم',
  CRITICAL: 'فوری',
};

const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function SupportScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [tickets, setTickets] = useState<AthleteTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      setTickets(await api.getMyTickets());
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'درخواست‌های پشتیبانی دریافت نشد.',
      );
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

  async function submit() {
    if (!subject.trim() || !description.trim()) {
      setError('موضوع و توضیحات درخواست را کامل کنید.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createPlatformTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      setTickets((current) => [created, ...current]);
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
      setShowForm(false);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'ثبت درخواست پشتیبانی انجام نشد.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionLoading || (loading && !tickets.length)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Brand.emerald} size="large" />
        <Text style={styles.muted}>در حال دریافت درخواست‌ها…</Text>
      </View>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={load}>
      <SectionTitle
        title="پشتیبانی گُردیار"
        hint="درخواست شما مستقیماً برای مدیریت اصلی سامانه ارسال می‌شود"
      />

      <Pressable
        onPress={() => setShowForm((current) => !current)}
        style={styles.newButton}>
        <Ionicons
          name={showForm ? 'close-outline' : 'add-outline'}
          size={22}
          color={Brand.ink}
        />
        <Text style={styles.newButtonText}>
          {showForm ? 'بستن فرم' : 'درخواست جدید'}
        </Text>
      </Pressable>

      {showForm ? (
        <Surface style={styles.form}>
          <FormField
            label="موضوع درخواست"
            icon="chatbox-ellipses-outline"
            value={subject}
            onChangeText={setSubject}
            maxLength={150}
            placeholder="مثلاً مشکل ورود یا پرداخت"
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>توضیحات</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={2000}
              multiline
              textAlign="right"
              textAlignVertical="top"
              placeholder="مشکل یا درخواست خود را با جزئیات بنویسید"
              placeholderTextColor={Brand.muted}
              style={styles.description}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>اولویت</Text>
            <View style={styles.priorities}>
              {priorities.map((value) => {
                const selected = priority === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setPriority(value)}
                    style={[styles.priority, selected && styles.prioritySelected]}>
                    <Text
                      style={[
                        styles.priorityText,
                        selected && styles.priorityTextSelected,
                      ]}>
                      {priorityLabel[value]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <PrimaryButton
            title="ارسال درخواست"
            onPress={submit}
            loading={submitting}
            disabled={!subject.trim() || !description.trim()}
          />
        </Surface>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {tickets.map((ticket) => (
        <Surface key={ticket.id} style={styles.ticket}>
          <View style={styles.ticketTop}>
            <View style={styles.ticketCopy}>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <Text style={styles.ticketDate}>
                {new Intl.DateTimeFormat('fa-IR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(ticket.createdAt))}
              </Text>
            </View>
            <View style={styles.badges}>
              <Text style={styles.priorityBadge}>{priorityLabel[ticket.priority]}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  ticket.status === 'RESOLVED' && styles.resolvedBadge,
                  ticket.status === 'CLOSED' && styles.closedBadge,
                ]}>
                {statusLabel[ticket.status]}
              </Text>
            </View>
          </View>
          <Text style={styles.ticketDescription}>{ticket.description}</Text>
        </Surface>
      ))}

      {!tickets.length ? (
        <Surface style={styles.empty}>
          <Ionicons name="help-buoy-outline" size={34} color={Brand.muted} />
          <Text style={styles.muted}>هنوز درخواست پشتیبانی ثبت نکرده‌اید.</Text>
        </Surface>
      ) : null}
    </Screen>
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
  muted: { color: Brand.muted, fontSize: 12, textAlign: 'center' },
  newButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: Brand.lime,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  newButtonText: { color: Brand.ink, fontSize: 14, fontWeight: '900' },
  form: { gap: 15 },
  field: { gap: 7 },
  fieldLabel: {
    color: Brand.text,
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'right',
  },
  description: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.card,
    color: Brand.text,
    padding: 14,
    fontSize: 13,
  },
  priorities: { flexDirection: 'row-reverse', gap: 7 },
  priority: {
    flex: 1,
    minHeight: 41,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioritySelected: { borderColor: Brand.emerald, backgroundColor: '#E9F4EC' },
  priorityText: { color: Brand.muted, fontSize: 10, fontWeight: '800' },
  priorityTextSelected: { color: Brand.emerald },
  error: {
    color: Brand.danger,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 11,
    fontSize: 12,
    textAlign: 'right',
  },
  ticket: { gap: 12 },
  ticketTop: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  ticketCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  ticketSubject: {
    color: Brand.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
  },
  ticketDate: { color: Brand.muted, fontSize: 9 },
  badges: { alignItems: 'flex-start', gap: 6 },
  priorityBadge: {
    color: Brand.muted,
    backgroundColor: Brand.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: '800',
  },
  statusBadge: {
    color: Brand.emerald,
    backgroundColor: '#EAF5ED',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: '900',
  },
  resolvedBadge: { color: '#267B45', backgroundColor: '#DDF3E4' },
  closedBadge: { color: Brand.muted, backgroundColor: '#EEF0EC' },
  ticketDescription: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'right',
  },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 30 },
});
