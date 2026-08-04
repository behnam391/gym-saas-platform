import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { ROLE_META, type ProProfile, type ProRole } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

export default function AccountScreen() {
  const { session, signOut } = useSession();
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const role = session?.role as ProRole | undefined;

  const load = useCallback(async () => {
    try {
      setProfile(await api.get<ProProfile>('/profiles/me'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!session || !role) return <Redirect href="/sign-in" />;
  if (loading) return <LoadingState />;

  async function logout() {
    Alert.alert('خروج از حساب', 'از گُردیار پرو خارج می‌شوید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/sign-in');
        },
      },
    ]);
  }

  return (
    <Screen onRefresh={load}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.firstName?.slice(0, 1) ?? 'گ'}</Text>
        </View>
        <Text style={styles.name}>
          {profile ? `${profile.firstName} ${profile.lastName}` : ROLE_META[role].label}
        </Text>
        <Text style={styles.role}>{ROLE_META[role].label}</Text>
        {profile?.tenant ? <Text style={styles.tenant}>{profile.tenant.name}</Text> : null}
      </View>

      <Card>
        <Info icon="call-outline" label="شماره موبایل" value={profile?.mobile ?? '—'} />
        <View style={styles.divider} />
        <Info icon="mail-outline" label="ایمیل" value={profile?.email ?? 'ثبت نشده'} />
        <View style={styles.divider} />
        <Info icon="location-outline" label="شهر" value={profile?.city ?? 'ثبت نشده'} />
      </Card>

      <Card style={styles.menu}>
        <MenuItem
          icon="lock-closed-outline"
          title="تغییر رمز عبور"
          onPress={() => router.push('/change-password')}
        />
        <MenuItem
          icon="notifications-outline"
          title="اعلان‌های من"
          onPress={() => router.push('/notifications')}
        />
        <MenuItem
          icon="help-buoy-outline"
          title="پشتیبانی گُردیار"
          onPress={() => router.push('/support')}
        />
      </Card>

      <Button title="خروج از حساب" icon="log-out-outline" onPress={logout} variant="danger" />
      <Text style={styles.version}>گُردیار پرو · نسخه ۱.۰.۰</Text>
    </Screen>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoValue}>{value}</Text>
      <View style={styles.infoLabel}>
        <Text style={styles.infoLabelText}>{label}</Text>
        <Ionicons name={icon} size={18} color={Brand.emerald} />
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Ionicons name="chevron-back" size={17} color={Brand.muted} />
      <Text style={styles.menuTitle}>{title}</Text>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={Brand.emerald} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: 5, paddingVertical: 10 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.ink,
    borderWidth: 4,
    borderColor: Brand.lime,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  name: { color: Brand.text, fontSize: 20, fontWeight: '900', marginTop: 5 },
  role: { color: Brand.emerald, fontSize: 12, fontWeight: '900' },
  tenant: { color: Brand.muted, fontSize: 11 },
  divider: { height: 1, backgroundColor: Brand.line, marginVertical: 12 },
  info: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  infoLabelText: { color: Brand.muted, fontSize: 11 },
  infoValue: { color: Brand.text, fontWeight: '800', fontSize: 12 },
  menu: { paddingVertical: 4 },
  menuItem: {
    minHeight: 63,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  menuTitle: { flex: 1, color: Brand.text, textAlign: 'right', fontWeight: '800', fontSize: 13 },
  menuIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: Brand.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: { textAlign: 'center', color: Brand.muted, fontSize: 10 },
});
