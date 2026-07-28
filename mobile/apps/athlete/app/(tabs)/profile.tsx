import type { AthleteProfileSummary } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
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
  const [profile, setProfile] = useState<AthleteProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setLoadError(null);
    try {
      setProfile(await api.getMyProfile());
    } catch {
      setLoadError('اطلاعات حساب دریافت نشد. یک‌بار خارج شوید و دوباره وارد شوید.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
    <Screen
      header={<BrandHeader />}
      refreshing={loading}
      onRefresh={loadProfile}>
      <Surface style={styles.identity}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={35} color={Brand.emerald} />
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.memberTitle}>
            {profile ? `${profile.firstName} ${profile.lastName}` : 'ورزشکار گُردیار'}
          </Text>
          <Text style={styles.memberHint}>
            {profile?.city ? `${profile.city} · حساب فعال و امن` : 'حساب فعال و امن'}
          </Text>
        </View>
        <View style={styles.verified}>
          <Ionicons name="checkmark-circle" size={20} color={Brand.emerald} />
        </View>
      </Surface>

      {loadError ? (
        <Surface style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={21} color={Brand.danger} />
          <Text style={styles.errorText}>{loadError}</Text>
        </Surface>
      ) : null}

      {profile?.memberships?.[0] ? (
        <MembershipCard membership={profile.memberships[0]} />
      ) : profile && !loading ? (
        <Surface>
          <Text style={styles.emptyMembership}>هنوز عضویت باشگاهی برای این حساب ثبت نشده است.</Text>
        </Surface>
      ) : null}

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

function MembershipCard({
  membership,
}: {
  membership: AthleteProfileSummary['memberships'][number];
}) {
  const active = membership.status === 'ACTIVE';
  const statusLabel: Record<typeof membership.status, string> = {
    ACTIVE: 'فعال',
    PENDING_INSURANCE: 'در انتظار بیمه',
    PENDING_PAYMENT: 'در انتظار پرداخت',
    EXPIRED: 'پایان‌یافته',
    SUSPENDED: 'تعلیق‌شده',
    CANCELLED: 'لغوشده',
  };
  const endDate = membership.endDate
    ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
        new Date(membership.endDate),
      )
    : 'پس از فعال‌سازی';

  return (
    <Surface style={styles.membership}>
      <View style={styles.membershipHeader}>
        <View style={[styles.statusBadge, !active && styles.statusBadgePending]}>
          <View style={[styles.statusDot, !active && styles.statusDotPending]} />
          <Text style={[styles.statusText, !active && styles.statusTextPending]}>
            {statusLabel[membership.status]}
          </Text>
        </View>
        <View style={styles.membershipCopy}>
          <Text style={styles.gymName}>{membership.tenant.name}</Text>
          <Text style={styles.planName}>{membership.plan.title}</Text>
        </View>
      </View>
      <View style={styles.membershipFooter}>
        <Text style={styles.membershipMetaValue}>{endDate}</Text>
        <Text style={styles.membershipMetaLabel}>اعتبار عضویت</Text>
      </View>
    </Surface>
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
  errorCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    borderColor: '#F3CACA',
    backgroundColor: '#FFF7F7',
  },
  errorText: { flex: 1, color: Brand.danger, textAlign: 'right', fontSize: 12, lineHeight: 19 },
  membership: { gap: 15, borderColor: '#BFD7C7' },
  membershipHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  membershipCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  gymName: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  planName: { color: Brand.muted, fontSize: 12, textAlign: 'right' },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E9F4EC',
  },
  statusBadgePending: { backgroundColor: '#FFF4DA' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.emerald },
  statusDotPending: { backgroundColor: Brand.warning },
  statusText: { color: Brand.emerald, fontSize: 11, fontWeight: '900' },
  statusTextPending: { color: '#9B6810' },
  membershipFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipMetaLabel: { color: Brand.muted, fontSize: 11 },
  membershipMetaValue: { color: Brand.text, fontWeight: '800', fontSize: 12 },
  emptyMembership: { color: Brand.muted, textAlign: 'center', fontSize: 12 },
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
