import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { apiMessage } from '@/lib/format';
import { useSession } from '@/providers/session-provider';

export default function ChangePasswordScreen() {
  const { session, signOut } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  if (!session) return <Redirect href="/sign-in" />;

  async function submit() {
    if (newPassword.length < 8) {
      Alert.alert('رمز کوتاه است', 'رمز جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmation) {
      Alert.alert('تکرار رمز', 'رمز جدید و تکرار آن یکسان نیست.');
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      await signOut();
      Alert.alert('رمز تغییر کرد', 'برای امنیت، دوباره با رمز جدید وارد شوید.', [
        { text: 'ورود مجدد', onPress: () => router.replace('/sign-in') },
      ]);
    } catch (reason) {
      Alert.alert('رمز تغییر نکرد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.notice}>
        <Text style={styles.noticeTitle}>امنیت حساب پرسنلی</Text>
        <Text style={styles.noticeText}>
          پس از تغییر رمز، همه نشست‌های قبلی بسته می‌شوند و باید دوباره وارد شوید.
        </Text>
      </Card>
      <Card style={styles.form}>
        <Field
          label="رمز عبور فعلی"
          icon="lock-closed-outline"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <Field
          label="رمز عبور جدید"
          icon="key-outline"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="حداقل ۸ کاراکتر"
        />
        <Field
          label="تکرار رمز جدید"
          icon="checkmark-circle-outline"
          secureTextEntry
          value={confirmation}
          onChangeText={setConfirmation}
        />
        <Button
          title="تغییر رمز و خروج امن"
          onPress={submit}
          loading={busy}
          disabled={!currentPassword || !newPassword || !confirmation}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  notice: { backgroundColor: Brand.warningSoft, borderColor: '#F2D7A0', gap: 5 },
  noticeTitle: { color: '#8A5700', fontSize: 13, fontWeight: '900', textAlign: 'right' },
  noticeText: { color: '#8A6D39', fontSize: 10, lineHeight: 17, textAlign: 'right' },
  form: { gap: 14 },
});
