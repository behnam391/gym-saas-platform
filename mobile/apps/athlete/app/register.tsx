import type { AthleteRegistration } from '@gordyar/mobile-core';
import { ApiError } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { toLatinDigits } from '@/lib/digits';

type Gender = AthleteRegistration['gender'];

const initialForm: AthleteRegistration = {
  firstName: '',
  lastName: '',
  nationalId: '',
  mobile: '',
  password: '',
  gender: 'MALE',
  dateOfBirth: '',
  city: '',
};

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ tenantId?: string; planId?: string }>();
  const [form, setForm] = useState<AthleteRegistration>({
    ...initialForm,
    tenantId: params.tenantId,
    membershipPlanId: params.planId,
  });
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <Key extends keyof AthleteRegistration>(
    key: Key,
    value: AthleteRegistration[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const mobile = toLatinDigits(form.mobile);
    const nationalId = toLatinDigits(form.nationalId);
    const dateOfBirth = toLatinDigits(form.dateOfBirth);
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.nationalId.trim() ||
      !form.mobile.trim() ||
      !form.dateOfBirth.trim()
    ) {
      return 'همه فیلدهای ضروری را کامل کنید.';
    }
    if (!/^09\d{9}$/.test(mobile)) return 'شماره موبایل را به شکل ۰۹xxxxxxxxx وارد کنید.';
    if (!/^\d{10}$/.test(nationalId)) return 'کد ملی باید ۱۰ رقم باشد.';
    if (form.password.length < 8) return 'رمز عبور باید حداقل ۸ نویسه باشد.';
    if (form.password !== passwordRepeat) return 'تکرار رمز عبور یکسان نیست.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return 'تاریخ تولد میلادی را به شکل ۱۹۹۶-۰۹-۰۵ وارد کنید.';
    }
    if (!accepted) return 'برای ساخت حساب، قوانین و حریم خصوصی را تایید کنید.';
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.registerAthlete({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nationalId: toLatinDigits(form.nationalId.trim()),
        mobile: toLatinDigits(form.mobile.trim()),
        dateOfBirth: toLatinDigits(form.dateOfBirth.trim()),
        city: form.city?.trim() || undefined,
      });
      router.replace({
        pathname: '/sign-in',
        params: { registered: '1', identifier: toLatinDigits(form.mobile.trim()) },
      });
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        setError('برای این شماره موبایل یا کد ملی قبلاً حساب ساخته شده است.');
      } else if (reason instanceof ApiError && reason.status === 403) {
        setError('دسترسی اپ به سرور موقتاً محدود است. تنظیمات امنیتی سرور در حال تکمیل است.');
      } else if (reason instanceof ApiError) {
        setError(reason.message);
      } else {
        setError('ثبت‌نام انجام نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <View style={styles.mark}>
          <Ionicons name="sparkles" size={24} color={Brand.emerald} />
        </View>
        <Text style={styles.title}>پرونده ورزشی خودت را بساز</Text>
        <Text style={styles.subtitle}>
          این اطلاعات برای عضویت باشگاه و خدمات ورزشی استفاده می‌شود و بدون اجازه تو در اختیار
          دیگران قرار نمی‌گیرد.
        </Text>
        {params.planId ? (
          <View style={styles.selectedPlan}>
            <Ionicons name="checkmark-circle" size={18} color={Brand.emerald} />
            <Text style={styles.selectedPlanText}>
              طرح انتخابی باشگاه همراه ثبت‌نام درخواست می‌شود.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.twoColumns}>
        <FormField
          label="نام"
          value={form.firstName}
          onChangeText={(value) => setField('firstName', value)}
          placeholder="نام ورزشکار"
          containerStyle={styles.flexInput}
        />
        <FormField
          label="نام خانوادگی"
          value={form.lastName}
          onChangeText={(value) => setField('lastName', value)}
          placeholder="نام خانوادگی"
          containerStyle={styles.flexInput}
        />
      </View>
      <FormField
        label="کد ملی"
        icon="id-card-outline"
        keyboardType="number-pad"
        maxLength={10}
        value={form.nationalId}
        onChangeText={(value) => setField('nationalId', value)}
        placeholder="۱۰ رقم بدون خط تیره"
      />
      <FormField
        label="شماره موبایل"
        icon="call-outline"
        keyboardType="phone-pad"
        maxLength={11}
        value={form.mobile}
        onChangeText={(value) => setField('mobile', value)}
        placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
      />
      <FormField
        label="تاریخ تولد (میلادی)"
        icon="calendar-outline"
        keyboardType="numbers-and-punctuation"
        value={form.dateOfBirth}
        onChangeText={(value) => setField('dateOfBirth', value)}
        placeholder="مثلاً ۱۹۹۶-۰۹-۰۵"
      />

      <View style={styles.genderGroup}>
        <Text style={styles.genderLabel}>جنسیت</Text>
        <View style={styles.genderOptions}>
          {([
            ['MALE', 'آقا'],
            ['FEMALE', 'خانم'],
            ['OTHER', 'سایر'],
          ] as [Gender, string][]).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setField('gender', value)}
              style={[styles.gender, form.gender === value && styles.genderActive]}>
              <Text
                style={[
                  styles.genderText,
                  form.gender === value && styles.genderTextActive,
                ]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FormField
        label="شهر (اختیاری)"
        icon="location-outline"
        value={form.city}
        onChangeText={(value) => setField('city', value)}
        placeholder="مثلاً شیراز"
      />
      <FormField
        label="رمز عبور"
        icon="lock-closed-outline"
        secureTextEntry
        value={form.password}
        onChangeText={(value) => setField('password', value)}
        placeholder="حداقل ۸ نویسه"
      />
      <FormField
        label="تکرار رمز عبور"
        icon="lock-closed-outline"
        secureTextEntry
        value={passwordRepeat}
        onChangeText={setPasswordRepeat}
        placeholder="رمز عبور را دوباره وارد کنید"
      />

      <Pressable onPress={() => setAccepted((value) => !value)} style={styles.accept}>
        <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
          {accepted ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
        <Text style={styles.acceptText}>
          قوانین استفاده و سیاست حریم خصوصی گُردیار را خوانده‌ام و می‌پذیرم.
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title="ساخت حساب ورزشکاری" onPress={submit} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16 },
  intro: { alignItems: 'center', gap: 8 },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Brand.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 350,
  },
  selectedPlan: {
    marginTop: 4,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#E9F4EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectedPlanText: { color: Brand.emerald, fontSize: 11, fontWeight: '800' },
  twoColumns: { flexDirection: 'row-reverse', gap: 10 },
  flexInput: { flex: 1, minWidth: 0 },
  genderGroup: { gap: 8 },
  genderLabel: { color: Brand.text, fontWeight: '800', fontSize: 13, textAlign: 'right' },
  genderOptions: { flexDirection: 'row-reverse', gap: 9 },
  gender: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderActive: { borderColor: Brand.emerald, backgroundColor: '#E9F4EC' },
  genderText: { color: Brand.muted, fontWeight: '800', fontSize: 12 },
  genderTextActive: { color: Brand.emerald },
  accept: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Brand.emerald, borderColor: Brand.emerald },
  acceptText: { flex: 1, color: Brand.muted, fontSize: 11, lineHeight: 19, textAlign: 'right' },
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
