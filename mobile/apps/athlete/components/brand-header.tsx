import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

export function BrandHeader() {
  const { session } = useSession();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        setUnread(0);
        return;
      }
      api.getMyNotifications()
        .then((items) => setUnread(items.filter((item) => !item.isRead).length))
        .catch(() => undefined);
    }, [session]),
  );

  return (
    <View style={styles.wrap}>
      <Image
        source={require('@/assets/images/gordyar-logo.png')}
        contentFit="contain"
        style={styles.logo}
      />
      {session ? (
        <View style={styles.accountActions}>
          <Link href={'/notifications' as Href} asChild>
            <Pressable style={styles.bell} accessibilityLabel="اعلان‌ها">
              <Ionicons name="notifications-outline" size={21} color={Brand.text} />
              {unread ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {Math.min(unread, 9).toLocaleString('fa-IR')}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
          <View style={styles.online}>
            <View style={styles.dot} />
            <Text style={styles.onlineText}>حساب فعال</Text>
          </View>
        </View>
      ) : (
        <Link href="/sign-in" asChild>
          <Pressable style={styles.signIn}>
            <Text style={styles.signInText}>ورود</Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.surface,
  },
  logo: { width: 132, height: 42 },
  signIn: {
    backgroundColor: Brand.ink,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  signInText: { color: Brand.lime, fontWeight: '800', fontSize: 14 },
  accountActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  online: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Brand.emerald },
  onlineText: { color: Brand.emerald, fontWeight: '700', fontSize: 12 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.card,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.danger,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
});
