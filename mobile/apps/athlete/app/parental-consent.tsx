import type { ParentalConsent } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { toLatinDigits } from '@/lib/digits';
import { useSession } from '@/providers/session-provider';

const statusLabels: Record<ParentalConsent['status'], string> = {
  PENDING: 'در انتظار بررسی',
  APPROVED: 'تأییدشده',
  REJECTED: 'نیازمند اصلاح',
};

type PickedDocument = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

export default function ParentalConsentScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [isMinor, setIsMinor] = useState<boolean | null>(null);
  const [current, setCurrent] = useState<ParentalConsent | null>(null);
  const [guardianName, setGuardianName] = useState('');
  const [guardianNationalId, setGuardianNationalId] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [picked, setPicked] = useState<PickedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConsent = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await api.getMyProfile();
      setIsMinor(profile.isMinor);
      setCurrent(profile.parentalConsent ?? null);
    } catch {
      setError('وضعیت رضایت‌نامه دریافت نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/sign-in');
      return;
    }
    loadConsent();
  }, [loadConsent, session, sessionLoading]);

  async function chooseDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 8 * 1024 * 1024) {
      Alert.alert('حجم زیاد', 'حجم فایل رضایت‌نامه باید کمتر از ۸ مگابایت باشد.');
      return;
    }
    setPicked({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? 'application/octet-stream',
      size: asset.size,
    });
  }

  async function submit() {
    const nationalId = toLatinDigits(guardianNationalId.trim());
    const mobile = toLatinDigits(guardianMobile.trim());
    if (guardianName.trim().length < 3) {
      Alert.alert('نام ولی ناقص است', 'نام و نام خانوادگی ولی را کامل وارد کنید.');
      return;
    }
    if (!/^\d{10}$/.test(nationalId)) {
      Alert.alert('کد ملی نامعتبر', 'کد ملی ولی باید ۱۰ رقم باشد.');
      return;
    }
    if (!/^09\d{9}$/.test(mobile)) {
      Alert.alert('موبایل نامعتبر', 'شماره موبایل ولی را به شکل 09xxxxxxxxx وارد کنید.');
      return;
    }
    if (!picked) {
      Alert.alert('فایل انتخاب نشده', 'تصویر یا فایل PDF رضایت‌نامه امضاشده را انتخاب کنید.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const uploaded = await api.uploadFile('PARENTAL_CONSENT', picked);
      const consent = await api.submitParentalConsent({
        guardianName: guardianName.trim(),
        guardianNationalId: nationalId,
        guardianMobile: mobile,
        documentUrl: uploaded.url,
      });
      setCurrent(consent);
      setPicked(null);
      Alert.alert(
        'رضایت‌نامه ارسال شد',
        'مدرک برای بررسی باشگاه ارسال شد و نتیجه در اعلان‌های شما نمایش داده می‌شود.',
      );
    } catch {
      setError(
        'ارسال رضایت‌نامه انجام نشد. اگر مدرکی در انتظار بررسی دارید، ابتدا نتیجه آن را پیگیری کنید.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || (loading && isMinor == null)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.emerald} />
        <Text style={styles.loadingText}>در حال دریافت وضعیت رضایت‌نامه…</Text>
      </View>
    );
  }

  if (isMinor === false) {
    return (
      <Screen>
        <SectionTitle
          title="رضایت‌نامه والدین"
          hint="این مدرک فقط برای ورزشکاران زیر ۱۸ سال لازم است"
        />
        <Surface style={styles.adultCard}>
          <Ionicons name="checkmark-circle" size={38} color={Brand.emerald} />
          <Text style={styles.adultTitle}>برای حساب شما رضایت‌نامه لازم نیست</Text>
          <Text style={styles.adultText}>
            سن ثبت‌شده برای این حساب ۱۸ سال یا بیشتر است و محدودیت والدین ندارید.
          </Text>
        </Surface>
      </Screen>
    );
  }

  const canSubmit = !current || current.status === 'REJECTED';

  return (
    <Screen refreshing={loading} onRefresh={loadConsent}>
      <SectionTitle
        title="رضایت‌نامه والدین"
        hint="برای برداشتن محدودیت حساب ورزشکار زیر ۱۸ سال"
      />

      {current ? (
        <ConsentStatusCard consent={current} />
      ) : (
        <Surface style={styles.emptyCard}>
          <Ionicons name="people-outline" size={34} color={Brand.muted} />
          <Text style={styles.emptyTitle}>رضایت‌نامه‌ای ثبت نشده است</Text>
          <Text style={styles.emptyText}>
            مشخصات ولی قانونی و تصویر رضایت‌نامه امضاشده را ارسال کنید.
          </Text>
        </Surface>
      )}

      {current?.documentUrl ? (
        <Pressable
          style={styles.viewButton}
          onPress={() => WebBrowser.openBrowserAsync(current.documentUrl)}>
          <Ionicons name="open-outline" size={18} color={Brand.emerald} />
          <Text style={styles.viewButtonText}>مشاهده مدرک ارسال‌شده</Text>
        </Pressable>
      ) : null}

      {canSubmit ? (
        <Surface style={styles.formCard}>
          <Text style={styles.formTitle}>
            {current?.status === 'REJECTED'
              ? 'ارسال رضایت‌نامه اصلاح‌شده'
              : 'ثبت رضایت‌نامه'}
          </Text>
          <FormField
            label="نام و نام خانوادگی ولی"
            icon="person-outline"
            value={guardianName}
            onChangeText={setGuardianName}
            placeholder="مثلاً علی رضایی"
          />
          <FormField
            label="کد ملی ولی"
            icon="id-card-outline"
            value={guardianNationalId}
            onChangeText={setGuardianNationalId}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="۱۰ رقم بدون خط تیره"
          />
          <FormField
            label="شماره موبایل ولی"
            icon="call-outline"
            value={guardianMobile}
            onChangeText={setGuardianMobile}
            keyboardType="phone-pad"
            maxLength={11}
            placeholder="09xxxxxxxxx"
          />
          <Pressable style={styles.picker} onPress={chooseDocument}>
            <View style={styles.pickerIcon}>
              <Ionicons
                name={picked ? 'document-attach' : 'cloud-upload-outline'}
                size={25}
                color={Brand.emerald}
              />
            </View>
            <View style={styles.pickerCopy}>
              <Text style={styles.pickerTitle}>
                {picked?.name ?? 'انتخاب تصویر یا PDF امضاشده'}
              </Text>
              <Text style={styles.pickerHint}>
                {picked?.size
                  ? `${(picked.size / 1024 / 1024).toFixed(1)} مگابایت`
                  : 'JPG، PNG یا PDF تا ۸ مگابایت'}
              </Text>
            </View>
          </Pressable>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <PrimaryButton
            title="ارسال برای بررسی باشگاه"
            onPress={submit}
            loading={saving}
          />
        </Surface>
      ) : (
        <Surface style={styles.infoCard}>
          <Ionicons
            name={current?.status === 'APPROVED' ? 'checkmark-circle' : 'time-outline'}
            size={23}
            color={current?.status === 'APPROVED' ? Brand.emerald : Brand.warning}
          />
          <Text style={styles.infoText}>
            {current?.status === 'APPROVED'
              ? 'رضایت‌نامه تأیید شده و محدودیت سنی حساب برداشته شده است.'
              : 'رضایت‌نامه در صف بررسی باشگاه است؛ نتیجه از طریق اعلان به شما اطلاع داده می‌شود.'}
          </Text>
        </Surface>
      )}
    </Screen>
  );
}

function ConsentStatusCard({ consent }: { consent: ParentalConsent }) {
  const approved = consent.status === 'APPROVED';
  const rejected = consent.status === 'REJECTED';
  return (
    <Surface
      style={[
        styles.statusCard,
        approved && styles.statusApproved,
        rejected && styles.statusRejected,
      ]}>
      <View style={styles.statusTop}>
        <View style={[styles.statusIcon, rejected && styles.statusIconRejected]}>
          <Ionicons
            name={approved ? 'people-circle' : rejected ? 'alert-circle' : 'time'}
            size={28}
            color={approved ? Brand.emerald : rejected ? Brand.danger : Brand.warning}
          />
        </View>
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>{statusLabels[consent.status]}</Text>
          <Text style={styles.statusHint}>
            ثبت در{' '}
            {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
              new Date(consent.createdAt),
            )}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={styles.detail}>ولی: {consent.guardianName}</Text>
        <Text style={styles.detail}>موبایل: {consent.guardianMobile}</Text>
      </View>
      {consent.rejectionReason ? (
        <Text style={styles.rejection}>{consent.rejectionReason}</Text>
      ) : null}
    </Surface>
  );
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
  adultCard: { alignItems: 'center', gap: 11, paddingVertical: 30 },
  adultTitle: { color: Brand.text, fontSize: 16, fontWeight: '900' },
  adultText: {
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 290,
  },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 27 },
  emptyTitle: { color: Brand.text, fontSize: 15, fontWeight: '900' },
  emptyText: { color: Brand.muted, fontSize: 11, lineHeight: 19, textAlign: 'center' },
  statusCard: { gap: 14, borderColor: '#E8D7AD', backgroundColor: '#FFFCF5' },
  statusApproved: { borderColor: '#BFD7C7', backgroundColor: '#FBFFF7' },
  statusRejected: { borderColor: '#F3CACA', backgroundColor: '#FFF8F8' },
  statusTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF2D5',
  },
  statusIconRejected: { backgroundColor: '#FFECEC' },
  statusCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  statusTitle: { color: Brand.text, fontSize: 16, fontWeight: '900' },
  statusHint: { color: Brand.muted, fontSize: 10 },
  details: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  detail: {
    color: Brand.muted,
    fontSize: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: Brand.card,
  },
  rejection: {
    color: Brand.danger,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'right',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3CACA',
  },
  viewButton: {
    minHeight: 45,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Brand.card,
  },
  viewButtonText: { color: Brand.emerald, fontSize: 12, fontWeight: '900' },
  formCard: { gap: 15 },
  formTitle: { color: Brand.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  picker: {
    minHeight: 86,
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.emerald,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FBFFF7',
  },
  pickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  pickerCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  pickerTitle: { color: Brand.text, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  pickerHint: { color: Brand.muted, fontSize: 10 },
  errorText: { color: Brand.danger, fontSize: 11, lineHeight: 19, textAlign: 'right' },
  infoCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, color: Brand.muted, fontSize: 11, lineHeight: 19, textAlign: 'right' },
});
