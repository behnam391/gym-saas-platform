import { ApiError } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

export default function ChangePasswordScreen() {
  const { session, signOut } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!session) {
      router.replace('/sign-in');
      return;
    }
    if (currentPassword.length === 0) {
      setError('رمز عبور فعلی را وارد کنید.');
      return;
    }
    if (newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ نویسه باشد.');
      return;
    }
    if (newPassword !== newPasswordAgain) {
      setError('تکرار رمز عبور با رمز جدید یکسان نیست.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('رمز عبور جدید باید با رمز فعلی متفاوت باشد.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      await signOut();
      router.replace({ pathname: '/sign-in', params: { passwordChanged: '1' } });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'تغییر رمز عبور انجام نشد؛ دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.mark}>
        <Ionicons name="shield-checkmark-outline" size={32} color={Brand.emerald} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>تغییر رمز عبور</Text>
        <Text style={styles.subtitle}>
          پس از تغییر رمز، برای محافظت از حساب همه نشست‌های فعال بسته می‌شوند.
        </Text>
      </View>

      <Surface style={styles.form}>
        <FormField
          label="رمز عبور فعلی"
          icon="lock-open-outline"
          secureTextEntry
          autoComplete="current-password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <FormField
          label="رمز عبور جدید"
          icon="lock-closed-outline"
          secureTextEntry
          autoComplete="new-password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="حداقل ۸ نویسه"
        />
        <FormField
          label="تکرار رمز عبور جدید"
          icon="shield-checkmark-outline"
          secureTextEntry
          autoComplete="new-password"
          value={newPasswordAgain}
          onChangeText={setNewPasswordAgain}
          onSubmitEditing={submit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title="تغییر رمز و خروج امن"
          onPress={submit}
          loading={busy}
          disabled={
            !currentPassword ||
            newPassword.length < 8 ||
            newPassword !== newPasswordAgain
          }
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 28 },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  heading: { alignItems: 'center', gap: 8 },
  title: { color: Brand.text, fontSize: 24, fontWeight: '900' },
  subtitle: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 340,
  },
  form: { gap: 15 },
  error: {
    color: Brand.danger,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 11,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
});
