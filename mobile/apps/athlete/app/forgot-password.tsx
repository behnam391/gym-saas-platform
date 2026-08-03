import { ApiError } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ContactVerification } from '@/components/contact-verification';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { Brand } from '@/constants/theme';
import { toLatinDigits } from '@/lib/digits';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerified = useCallback((token: string | null) => {
    setVerificationToken(token);
  }, []);

  async function submit() {
    if (!verificationToken) {
      setError('ابتدا شماره موبایل یا ایمیل ثبت‌شده را تأیید کنید.');
      return;
    }
    if (password.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ نویسه باشد.');
      return;
    }
    if (password !== passwordAgain) {
      setError('تکرار رمز عبور با رمز جدید یکسان نیست.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.resetPassword(verificationToken, password);
      router.replace({
        pathname: '/sign-in',
        params: { passwordChanged: '1', identifier: toLatinDigits(mobile.trim()) },
      });
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
        <Ionicons name="key-outline" size={31} color={Brand.emerald} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>بازیابی رمز عبور</Text>
        <Text style={styles.subtitle}>
          شماره موبایل یا ایمیل ثبت‌شده در حساب ورزشکاری را تأیید کنید.
        </Text>
      </View>

      <View style={styles.form}>
        <FormField
          label="شماره موبایل"
          icon="call-outline"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={mobile}
          onChangeText={setMobile}
          placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
        />
        <FormField
          label="ایمیل"
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
        />

        <ContactVerification
          mobile={mobile}
          email={email}
          purpose="RESET_PASSWORD"
          onVerified={handleVerified}
        />

        {verificationToken ? (
          <>
            <FormField
              label="رمز عبور جدید"
              icon="lock-closed-outline"
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              placeholder="حداقل ۸ نویسه"
            />
            <FormField
              label="تکرار رمز عبور جدید"
              icon="shield-checkmark-outline"
              secureTextEntry
              autoComplete="new-password"
              value={passwordAgain}
              onChangeText={setPasswordAgain}
              placeholder="رمز جدید را دوباره وارد کنید"
              onSubmitEditing={submit}
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title="ثبت رمز عبور جدید"
          onPress={submit}
          loading={busy}
          disabled={
            !verificationToken ||
            password.length < 8 ||
            password !== passwordAgain
          }
        />
      </View>

      <Link href="/sign-in" style={styles.backLink}>
        بازگشت به صفحه ورود
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 28, justifyContent: 'center' },
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
  title: { color: Brand.text, fontSize: 25, fontWeight: '900' },
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
  backLink: {
    color: Brand.emerald,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
