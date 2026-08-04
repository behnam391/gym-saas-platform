import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { EmptyState, LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import type { Conversation } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

export default function MessagesScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<Conversation[]>('/messages/conversations'));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!session) return <Redirect href="/sign-in" />;
  if (loading) return <LoadingState label="در حال دریافت پیام‌ها…" />;

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <SectionHeader title="پیام‌ها" subtitle="گفت‌وگوهای امن داخل باشگاه" />
      {items.length ? (
        items.map((item) => (
          <Pressable
            key={item.conversationId}
            onPress={() =>
              router.push({
                pathname: '/conversation/[id]',
                params: {
                  id: item.conversationId,
                  recipientId: item.otherUser?.id ?? '',
                  name: item.otherUser
                    ? `${item.otherUser.firstName} ${item.otherUser.lastName}`
                    : 'گفت‌وگو',
                },
              })
            }>
            <Card style={styles.item}>
              <Ionicons name="chevron-back" size={18} color={Brand.muted} />
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  {item.unreadCount ? <Badge tone="info">{item.unreadCount} جدید</Badge> : null}
                  <Text style={styles.title}>
                    {item.otherUser
                      ? `${item.otherUser.firstName} ${item.otherUser.lastName}`
                      : 'کاربر باشگاه'}
                  </Text>
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage.body}
                </Text>
                <Text style={styles.date}>{dateTime(item.lastMessage.createdAt)}</Text>
              </View>
              <View style={styles.avatar}>
                <Ionicons name="person" size={21} color={Brand.emerald} />
              </View>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <EmptyState
            title="هنوز پیامی ندارید"
            description="پس از شروع گفت‌وگو با اعضا یا همکاران، پیام‌ها اینجا نمایش داده می‌شوند."
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  body: { flex: 1, alignItems: 'flex-end', gap: 5 },
  titleRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Brand.text, fontWeight: '900', fontSize: 13 },
  preview: { color: Brand.muted, fontSize: 11, maxWidth: '100%' },
  date: { color: '#98A39D', fontSize: 9 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Brand.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
