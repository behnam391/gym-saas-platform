import type { InsuranceDocument } from '@gordyar/mobile-core';
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
import { useSession } from '@/providers/session-provider';

const statusLabels: Record<InsuranceDocument['status'], string> = {
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

export default function InsuranceScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [current, setCurrent] = useState<InsuranceDocument | null>(null);
  const [picked, setPicked] = useState<PickedDocument | null>(null);
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsurance = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await api.getMyProfile();
      setCurrent(profile.insuranceDocs?.[0] ?? null);
    } catch {
      setError('وضعیت بیمه دریافت نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/sign-in');
      return;
    }
    loadInsurance();
  }, [loadInsurance, session, sessionLoading]);

  async function chooseDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 8 * 1024 * 1024) {
      Alert.alert('حجم زیاد', 'حجم مدرک باید کمتر از ۸ مگابایت باشد.');
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
    if (!picked) {
      Alert.alert('مدرک انتخاب نشده', 'تصویر یا فایل PDF بیمه را انتخاب کنید.');
      return;
    }
    if (validFrom && validUntil && validUntil <= validFrom) {
      Alert.alert('تاریخ نامعتبر', 'تاریخ پایان باید بعد از تاریخ شروع باشد.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const uploaded = await api.uploadFile('INSURANCE_DOCUMENT', picked);
      const document = await api.submitInsurance({
        documentUrl: uploaded.url,
        provider: provider.trim() || undefined,
        policyNumber: policyNumber.trim() || undefined,
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
      });
      setCurrent(document);
      setPicked(null);
      Alert.alert(
        'مدرک ارسال شد',
        'بیمه برای بررسی باشگاه ارسال شد و نتیجه در اعلان‌های شما نمایش داده می‌شود.',
      );
    } catch {
      setError(
        'ارسال مدرک انجام نشد. اگر مدرک دیگری در انتظار بررسی دارید، ابتدا نتیجه آن را پیگیری کنید.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || (loading && !current)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.emerald} />
        <Text style={styles.loadingText}>در حال دریافت وضعیت بیمه…</Text>
      </View>
    );
  }

  const isExpired =
    current?.status === 'APPROVED' &&
    current.validUntil != null &&
    new Date(current.validUntil) <= new Date();
  const canSubmit = !current || current.status === 'REJECTED' || isExpired;

  return (
    <Screen refreshing={loading} onRefresh={loadInsurance}>
      <SectionTitle
        title="بیمه ورزشی"
        hint="مدرک معتبر برای فعال‌سازی عضویت و پرداخت"
      />

      {current ? <InsuranceStatusCard document={current} /> : (
        <Surface style={styles.emptyCard}>
          <Ionicons name="shield-outline" size={33} color={Brand.muted} />
          <Text style={styles.emptyTitle}>هنوز مدرک بیمه ثبت نشده است</Text>
          <Text style={styles.emptyText}>
            تصویر کارت بیمه یا فایل PDF را برای بررسی باشگاه ارسال کنید.
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
              ? 'ارسال مدرک اصلاح‌شده'
              : isExpired
                ? 'تمدید بیمه ورزشی'
                : 'ثبت مدرک جدید'}
          </Text>
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
                {picked?.name ?? 'انتخاب تصویر یا PDF'}
              </Text>
              <Text style={styles.pickerHint}>
                {picked?.size
                  ? `${(picked.size / 1024 / 1024).toFixed(1)} مگابایت`
                  : 'JPG، PNG یا PDF تا ۸ مگابایت'}
              </Text>
            </View>
          </Pressable>
          <FormField
            label="نام شرکت یا سامانه بیمه"
            icon="business-outline"
            placeholder="مثلاً فدراسیون پزشکی ورزشی"
            value={provider}
            onChangeText={setProvider}
          />
          <FormField
            label="شماره بیمه‌نامه"
            icon="document-text-outline"
            value={policyNumber}
            onChangeText={setPolicyNumber}
          />
          <View style={styles.dateRow}>
            <FormField
              label="شروع اعتبار"
              placeholder="2026-07-30"
              value={validFrom}
              onChangeText={setValidFrom}
              containerStyle={styles.dateField}
            />
            <FormField
              label="پایان اعتبار"
              placeholder="2027-07-30"
              value={validUntil}
              onChangeText={setValidUntil}
              containerStyle={styles.dateField}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <PrimaryButton
            title="ارسال برای بررسی"
            onPress={submit}
            loading={saving}
          />
        </Surface>
      ) : (
        <Surface style={styles.infoCard}>
          <Ionicons
            name={current?.status === 'APPROVED' ? 'checkmark-circle' : 'time-outline'}
            size={22}
            color={current?.status === 'APPROVED' ? Brand.emerald : Brand.warning}
          />
          <Text style={styles.infoText}>
            {current?.status === 'APPROVED'
              ? 'بیمه معتبر است. اگر عضویت در انتظار پرداخت باشد، از بخش پرداخت‌ها ادامه دهید.'
              : 'مدرک در صف بررسی باشگاه است؛ پس از بررسی برای شما اعلان ارسال می‌شود.'}
          </Text>
        </Surface>
      )}
    </Screen>
  );
}

function InsuranceStatusCard({ document }: { document: InsuranceDocument }) {
  const approved = document.status === 'APPROVED';
  const rejected = document.status === 'REJECTED';
  const expired =
    approved &&
    document.validUntil != null &&
    new Date(document.validUntil) <= new Date();
  return (
    <Surface
      style={[
        styles.statusCard,
        approved && styles.statusApproved,
        rejected && styles.statusRejected,
      ]}>
      <View style={styles.statusTop}>
        <View
          style={[
            styles.statusIcon,
            rejected && styles.statusIconRejected,
          ]}>
          <Ionicons
            name={approved ? 'shield-checkmark' : rejected ? 'alert-circle' : 'time'}
            size={27}
            color={approved ? Brand.emerald : rejected ? Brand.danger : Brand.warning}
          />
        </View>
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>
            {expired ? 'اعتبار بیمه تمام شده' : statusLabels[document.status]}
          </Text>
          <Text style={styles.statusHint}>
            ثبت در{' '}
            {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
              new Date(document.createdAt),
            )}
          </Text>
        </View>
      </View>
      {document.provider || document.policyNumber ? (
        <View style={styles.details}>
          {document.provider ? <Text style={styles.detail}>بیمه‌گر: {document.provider}</Text> : null}
          {document.policyNumber ? (
            <Text style={styles.detail}>شماره: {document.policyNumber}</Text>
          ) : null}
        </View>
      ) : null}
      {document.rejectionReason ? (
        <Text style={styles.rejection}>{document.rejectionReason}</Text>
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
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 26 },
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
  dateRow: { flexDirection: 'row-reverse', gap: 10 },
  dateField: { flex: 1 },
  errorText: { color: Brand.danger, fontSize: 11, lineHeight: 19, textAlign: 'right' },
  infoCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, color: Brand.muted, fontSize: 11, lineHeight: 19, textAlign: 'right' },
});
