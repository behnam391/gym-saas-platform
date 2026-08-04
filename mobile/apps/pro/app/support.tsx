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
import { apiMessage, dateTime } from '@/lib/format';
import type { Ticket } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

const PRIORITIES = [
  ['LOW', 'عادی'],
  ['MEDIUM', 'متوسط'],
  ['HIGH', 'مهم'],
  ['CRITICAL', 'فوری'],
] as const;

export default function SupportScreen() {
  const { session } = useSession();
  const role = session?.role;
  const [items, setItems] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Ticket['priority']>('MEDIUM');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<Ticket[]>('/tickets/mine'));
    } catch (reason) {
      Alert.alert('خطا', apiMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) load();
  }, [load, session]);

  if (!session) return <Redirect href="/sign-in" />;
  if (loading) return <LoadingState />;

  async function create() {
    if (subject.trim().length < 3 || description.trim().length < 10) {
      Alert.alert('توضیح ناقص', 'موضوع و توضیح کامل‌تری برای درخواست بنویسید.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/tickets', {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        targetType: role === 'TRAINER' ? 'TRAINER' : role === 'NUTRITIONIST' ? 'NUTRITIONIST' : 'GYM',
      });
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
      await load();
      Alert.alert('درخواست ثبت شد', 'پشتیبانی گُردیار درخواست شما را پیگیری می‌کند.');
    } catch (reason) {
      Alert.alert('ثبت نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen onRefresh={load}>
      <Card style={styles.form}>
        <Text style={styles.title}>درخواست جدید</Text>
        <Field label="موضوع" value={subject} onChangeText={setSubject} placeholder="موضوع درخواست پشتیبانی" />
        <Field label="توضیحات" multiline value={description} onChangeText={setDescription} placeholder="مشکل یا درخواست را دقیق توضیح دهید…" />
        <Text style={styles.label}>اولویت</Text>
        <View style={styles.priorities}>
          {PRIORITIES.map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setPriority(value)}
              style={[styles.priority, priority === value && styles.priorityActive]}>
              <Text style={[styles.priorityText, priority === value && styles.priorityTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Button title="ثبت درخواست پشتیبانی" onPress={create} loading={busy} />
      </Card>

      <Text style={styles.listTitle}>درخواست‌های من</Text>
      {items.length ? (
        items.map((item) => (
          <Card key={item.id} style={styles.ticket}>
            <View style={styles.ticketHead}>
              <Badge tone={item.status === 'RESOLVED' || item.status === 'CLOSED' ? 'success' : 'warning'}>
                {statusLabel(item.status)}
              </Badge>
              <View style={styles.ticketBody}>
                <Text style={styles.ticketTitle}>{item.subject}</Text>
                <Text style={styles.ticketDate}>{dateTime(item.createdAt)}</Text>
              </View>
            </View>
            <Text style={styles.ticketDescription}>{item.description}</Text>
          </Card>
        ))
      ) : (
        <Card><EmptyState title="هنوز درخواست پشتیبانی ندارید" /></Card>
      )}
    </Screen>
  );
}

function statusLabel(status: Ticket['status']) {
  return { OPEN: 'باز', IN_PROGRESS: 'در حال پیگیری', RESOLVED: 'حل‌شده', CLOSED: 'بسته' }[status];
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  title: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  label: { color: Brand.text, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  priorities: { flexDirection: 'row-reverse', gap: 7 },
  priority: { flex: 1, alignItems: 'center', borderRadius: 11, backgroundColor: Brand.surface, paddingVertical: 9 },
  priorityActive: { backgroundColor: Brand.lime },
  priorityText: { color: Brand.muted, fontSize: 9, fontWeight: '800' },
  priorityTextActive: { color: Brand.ink },
  listTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  ticket: { gap: 10 },
  ticketHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  ticketBody: { flex: 1, alignItems: 'flex-end' },
  ticketTitle: { color: Brand.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  ticketDate: { color: Brand.muted, fontSize: 9, marginTop: 3 },
  ticketDescription: { color: Brand.muted, fontSize: 10, lineHeight: 18, textAlign: 'right' },
});
