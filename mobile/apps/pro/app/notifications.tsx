import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { apiMessage, dateTime } from '@/lib/format';
import type { ProNotification } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

export default function NotificationsScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<ProNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<ProNotification[]>('/notifications/mine'));
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
  if (loading) return <LoadingState label="در حال دریافت اعلان‌ها…" />;

  async function markAll() {
    setBusy(true);
    try {
      await api.patch('/notifications/read-all');
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (reason) {
      Alert.alert('انجام نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function mark(item: ProNotification) {
    if (item.isRead) return;
    try {
      await api.patch(`/notifications/${item.id}/read`);
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
    } catch {
      // The next refresh retries silently.
    }
  }

  return (
    <Screen onRefresh={load}>
      {items.some((item) => !item.isRead) ? (
        <Button title="خواندن همه اعلان‌ها" variant="secondary" loading={busy} onPress={markAll} />
      ) : null}
      {items.length ? (
        items.map((item) => (
          <Pressable key={item.id} onPress={() => mark(item)}>
            <Card style={[styles.item, !item.isRead && styles.unread]}>
              <View style={styles.itemHead}>
                {!item.isRead ? <Badge tone="info">جدید</Badge> : null}
                <View style={styles.itemBody}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.date}>{dateTime(item.createdAt)}</Text>
                </View>
                <View style={styles.icon}>
                  <Ionicons name="notifications" size={20} color={Brand.emerald} />
                </View>
              </View>
              <Text style={styles.body}>{item.body}</Text>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <EmptyState title="اعلان جدیدی ندارید" description="رویدادهای مهم باشگاه در این بخش نمایش داده می‌شوند." />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { gap: 11 },
  unread: { borderColor: '#AFC9F7', backgroundColor: '#F8FAFF' },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  itemBody: { flex: 1, alignItems: 'flex-end' },
  title: { color: Brand.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  date: { color: Brand.muted, fontSize: 9, marginTop: 3 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Brand.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  body: { color: Brand.muted, fontSize: 11, lineHeight: 19, textAlign: 'right' },
});
