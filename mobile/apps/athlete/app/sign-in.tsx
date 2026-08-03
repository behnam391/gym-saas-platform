import { ApiError } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, type Href, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { Brand } from '@/constants/theme';
import { toLatinDigits } from '@/lib/digits';
import { useSession } from '@/providers/session-provider';

export default function SignInScreen() {
  const params = useLocalSearchParams<{
    identifier?: string;
    registered?: string;
    passwordChanged?: string;
  }>();
  const { signIn } = useSession();
  const [identifier, setIdentifier] = useState(params.identifier ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!identifier.trim() || !password) {
      setError('شماره موبایل یا کد ملی و رمز عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signIn(toLatinDigits(identifier.trim()), password);
      router.replace('/');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 403) {
        setError('دسترسی اپ به سرور موقتاً محدود است. تنظیمات امنیتی سرور در حال تکمیل است.');
      } else if (reason instanceof ApiError && reason.status === 401) {
        setError('اطلاعات ورود درست نیست. شماره یا رمز عبور را بررسی کنید.');
      } else {
        setError('ورود انجام نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.mark}>
        <Ionicons name="person" size={30} color={Brand.emerald} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>خوش آمدی قهرمان</Text>
        <Text style={styles.subtitle}>
          این ورودی فقط برای ورزشکاران است؛ اطلاعات مدیران باشگاه از مسیر جداگانه محافظت می‌شود.
        </Text>
      </View>

      <View style={styles.form}>
        {params.registered === '1' ? (
          <Text style={styles.success}>حساب با موفقیت ساخته شد؛ حالا وارد گُردیار شوید.</Text>
        ) : null}
        {params.passwordChanged === '1' ? (
          <Text style={styles.success}>رمز عبور با موفقیت تغییر کرد؛ با رمز جدید وارد شوید.</Text>
        ) : null}
        <FormField
          label="شماره موبایل یا کد ملی"
          icon="call-outline"
          keyboardType="number-pad"
          autoComplete="tel"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
        />
        <FormField
          label="رمز عبور"
          icon="lock-closed-outline"
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          placeholder="رمز عبور حساب ورزشکاری"
          onSubmitEditing={submit}
        />
        <Link href={'/forgot-password' as Href} style={styles.forgotLink}>
          رمز عبور را فراموش کرده‌اید؟
        </Link>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="ورود به گُردیار" onPress={submit} loading={loading} />
      </View>

      <View style={styles.registerRow}>
        <Link href="/register" style={styles.registerLink}>
          ساخت حساب ورزشکاری
        </Link>
        <Text style={styles.registerHint}>هنوز عضو گُردیار نیستی؟</Text>
      </View>

      <View style={styles.security}>
        <Ionicons name="shield-checkmark-outline" size={18} color={Brand.emerald} />
        <Text style={styles.securityText}>
          نشست شما به‌صورت رمزگذاری‌شده در فضای امن گوشی نگهداری می‌شود.
        </Text>
      </View>
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
  success: {
    color: Brand.emerald,
    backgroundColor: '#E9F4EC',
    borderRadius: 12,
    padding: 11,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  registerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  registerHint: { color: Brand.muted, fontSize: 12 },
  registerLink: { color: Brand.emerald, fontSize: 12, fontWeight: '900' },
  forgotLink: {
    color: Brand.emerald,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  security: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  securityText: { color: Brand.muted, fontSize: 10, textAlign: 'right' },
});
