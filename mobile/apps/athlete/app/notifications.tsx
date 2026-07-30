import type { AppNotification } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

export default function NotificationsScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await api.getMyNotifications());
    } catch {
      setError('اعلان‌ها دریافت نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/sign-in');
      return;
    }
    loadNotifications();
  }, [loadNotifications, session, sessionLoading]);

  async function markRead(notification: AppNotification) {
    if (notification.isRead) return;
    setItems((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    await api.markNotificationRead(notification.id).catch(() => {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: false } : item,
        ),
      );
    });
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  if (sessionLoading || (loading && !items.length)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.emerald} />
        <Text style={styles.loadingText}>در حال دریافت اعلان‌ها…</Text>
      </View>
    );
  }

  const unread = items.filter((item) => !item.isRead).length;

  return (
    <Screen refreshing={loading} onRefresh={loadNotifications}>
      <SectionTitle
        title="اعلان‌های من"
        hint={
          unread
            ? `${unread.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
            : 'همه اعلان‌ها خوانده شده‌اند'
        }
      />

      {unread ? (
        <Pressable
          disabled={markingAll}
          onPress={markAllRead}
          style={styles.markAll}>
          {markingAll ? (
            <ActivityIndicator size="small" color={Brand.emerald} />
          ) : (
            <Ionicons name="checkmark-done" size={18} color={Brand.emerald} />
          )}
          <Text style={styles.markAllText}>خواندن همه</Text>
        </Pressable>
      ) : null}

      {error ? (
        <Surface style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={21} color={Brand.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Surface>
      ) : null}

      <View style={styles.list}>
        {items.map((notification) => (
          <Pressable
            key={notification.id}
            onPress={() => markRead(notification)}>
            <Surface
              style={[
                styles.notification,
                !notification.isRead && styles.notificationUnread,
              ]}>
              <View
                style={[
                  styles.notificationIcon,
                  !notification.isRead && styles.notificationIconUnread,
                ]}>
                <Ionicons
                  name={iconFor(notification)}
                  size={22}
                  color={Brand.emerald}
                />
              </View>
              <View style={styles.notificationCopy}>
                <View style={styles.titleRow}>
                  {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                </View>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <Text style={styles.notificationDate}>
                  {new Intl.DateTimeFormat('fa-IR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(notification.createdAt))}
                </Text>
              </View>
            </Surface>
          </Pressable>
        ))}
      </View>

      {!items.length ? (
        <Surface style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={35} color={Brand.muted} />
          <Text style={styles.emptyTitle}>اعلانی ندارید</Text>
          <Text style={styles.emptyText}>
            نتیجه بررسی بیمه، پرداخت‌ها و پیام‌های مهم اینجا نمایش داده می‌شود.
          </Text>
        </Surface>
      ) : null}
    </Screen>
  );
}

function iconFor(notification: AppNotification): keyof typeof Ionicons.glyphMap {
  const type = notification.metadata?.type;
  if (type === 'INSURANCE_REVIEW') return 'shield-checkmark-outline';
  if (type === 'PARENTAL_CONSENT_REVIEW') return 'people-outline';
  if (notification.title.includes('پرداخت')) return 'card-outline';
  if (notification.title.includes('برنامه')) return 'barbell-outline';
  return 'notifications-outline';
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
  markAll: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Brand.line,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.card,
  },
  markAllText: { color: Brand.emerald, fontSize: 11, fontWeight: '900' },
  errorCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    borderColor: '#F3CACA',
    backgroundColor: '#FFF7F7',
  },
  errorText: { flex: 1, color: Brand.danger, textAlign: 'right', fontSize: 12 },
  list: { gap: 10 },
  notification: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
  },
  notificationUnread: { borderColor: '#BFD7C7', backgroundColor: '#FBFFF7' },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surface,
  },
  notificationIconUnread: { backgroundColor: '#E9F4EC' },
  notificationCopy: { flex: 1, alignItems: 'flex-end', gap: 6 },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.emerald },
  notificationTitle: { color: Brand.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  notificationBody: { color: Brand.muted, fontSize: 11, lineHeight: 19, textAlign: 'right' },
  notificationDate: { color: Brand.muted, fontSize: 9 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyTitle: { color: Brand.text, fontSize: 15, fontWeight: '900' },
  emptyText: {
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 290,
  },
});
