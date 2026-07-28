import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { Brand } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';

const accountItems = [
  { icon: 'person-outline' as const, title: 'اطلاعات فردی و عکس پروفایل' },
  { icon: 'card-outline' as const, title: 'عضویت‌ها و پرداخت‌ها' },
  { icon: 'shield-checkmark-outline' as const, title: 'بیمه ورزشی و مدارک' },
  { icon: 'settings-outline' as const, title: 'تنظیمات و حریم خصوصی' },
];

export default function ProfileScreen() {
  const { session, signOut } = useSession();
  const [leaving, setLeaving] = useState(false);

  const handleSignOut = () => {
    Alert.alert('خروج از حساب', 'می‌خواهید از حساب ورزشکاری خود خارج شوید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true);
          try {
            await signOut();
            router.replace('/');
          } finally {
            setLeaving(false);
          }
        },
      },
    ]);
  };

  if (!session) {
    return (
      <Screen header={<BrandHeader />}>
        <Surface style={styles.guest}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={35} color={Brand.emerald} />
          </View>
          <Text style={styles.guestTitle}>حساب ورزشکاری گُردیار</Text>
          <Text style={styles.guestText}>
            برای مشاهده عضویت‌ها، برنامه‌ها، پرداخت‌ها و سوابق ورزشی وارد حساب خود شوید.
          </Text>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.login}>
              <Text style={styles.loginText}>ورود ورزشکار</Text>
            </Pressable>
          </Link>
          <Link href="/register" style={styles.register}>
            هنوز حساب ندارم؛ ثبت‌نام
          </Link>
        </Surface>
      </Screen>
    );
  }

  return (
    <Screen header={<BrandHeader />}>
      <Surface style={styles.identity}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={35} color={Brand.emerald} />
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.memberTitle}>ورزشکار گُردیار</Text>
          <Text style={styles.memberHint}>حساب فعال و امن</Text>
        </View>
        <View style={styles.verified}>
          <Ionicons name="checkmark-circle" size={20} color={Brand.emerald} />
        </View>
      </Surface>

      <View style={styles.items}>
        {accountItems.map((item) => (
          <Pressable key={item.title} style={styles.item}>
            <View style={styles.itemIcon}>
              <Ionicons name={item.icon} size={21} color={Brand.emerald} />
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Ionicons name="chevron-back" size={18} color={Brand.muted} />
          </Pressable>
        ))}
      </View>

      <PrimaryButton title="خروج از حساب" onPress={handleSignOut} loading={leaving} />
      <Text style={styles.version}>گُردیار ورزشکار · نسخه آزمایشی ۱.۰</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  guestTitle: { color: Brand.text, fontSize: 18, fontWeight: '900' },
  guestText: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 310,
  },
  login: {
    minHeight: 50,
    minWidth: 220,
    backgroundColor: Brand.lime,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: { color: Brand.ink, fontWeight: '900' },
  register: { color: Brand.emerald, fontWeight: '800', fontSize: 13 },
  identity: { flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  identityCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  memberTitle: { color: Brand.text, fontSize: 17, fontWeight: '900' },
  memberHint: { color: Brand.muted, fontSize: 12 },
  verified: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Brand.card,
  },
  item: {
    minHeight: 65,
    paddingHorizontal: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.line,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { flex: 1, color: Brand.text, fontWeight: '800', textAlign: 'right', fontSize: 13 },
  version: { color: Brand.muted, fontSize: 11, textAlign: 'center' },
});
