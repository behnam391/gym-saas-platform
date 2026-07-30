import type {
  AthleteMembership,
  AthletePayment,
} from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

const statusLabels: Record<AthletePayment['status'], string> = {
  SUCCEEDED: 'پرداخت‌شده',
  PENDING: 'در انتظار',
  FAILED: 'ناموفق',
  REFUNDED: 'برگشت‌خورده',
};

const methodLabels: Record<AthletePayment['method'], string> = {
  CASH: 'نقدی',
  POS: 'کارت‌خوان',
  ONLINE_GATEWAY: 'زرین‌پال',
  WALLET: 'کیف پول',
};

export default function PaymentsScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [payments, setPayments] = useState<AthletePayment[]>([]);
  const [memberships, setMemberships] = useState<AthleteMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [nextPayments, nextMemberships] = await Promise.all([
        api.getMyPayments(),
        api.getMyMemberships(),
      ]);
      setPayments(nextPayments);
      setMemberships(nextMemberships);
    } catch {
      setError('سوابق پرداخت دریافت نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/sign-in');
      return;
    }
    loadData();
  }, [loadData, session, sessionLoading]);

  const successfulTotal = useMemo(
    () =>
      payments
        .filter((item) => item.status === 'SUCCEEDED')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    [payments],
  );
  const payableMemberships = memberships.filter(
    (membership) => membership.status === 'PENDING_PAYMENT',
  );

  async function pay(membership: AthleteMembership) {
    setPayingId(membership.id);
    setError(null);
    try {
      const result = await api.startMembershipPayment(membership.id);
      const browserResult = await WebBrowser.openBrowserAsync(result.redirectUrl, {
        controlsColor: Brand.emerald,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });
      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        await loadData();
      }
    } catch {
      Alert.alert(
        'اتصال به درگاه انجام نشد',
        'بیمه ورزشی و وضعیت عضویت را بررسی و دوباره تلاش کنید.',
      );
    } finally {
      setPayingId(null);
    }
  }

  if (sessionLoading || (loading && !payments.length && !memberships.length)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.emerald} />
        <Text style={styles.loadingText}>در حال دریافت پرداخت‌ها…</Text>
      </View>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={loadData}>
      <SectionTitle
        title="پرداخت‌ها و رسیدها"
        hint="پرداخت امن عضویت و سوابق مالی ثبت‌شده"
      />

      {error ? (
        <Surface style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={21} color={Brand.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Surface>
      ) : null}

      {payableMemberships.map((membership) => (
        <Surface key={membership.id} style={styles.payableCard}>
          <View style={styles.payableTop}>
            <View style={styles.secureIcon}>
              <Ionicons name="shield-checkmark" size={24} color={Brand.emerald} />
            </View>
            <View style={styles.payableCopy}>
              <Text style={styles.payableTitle}>{membership.plan.title}</Text>
              <Text style={styles.payableGym}>{membership.tenant.name}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {Number(membership.plan.price).toLocaleString('fa-IR')} تومان
            </Text>
            <Text style={styles.priceLabel}>مبلغ عضویت</Text>
          </View>
          <Pressable
            disabled={payingId === membership.id}
            onPress={() => pay(membership)}
            style={({ pressed }) => [
              styles.payButton,
              pressed && styles.payButtonPressed,
              payingId === membership.id && styles.payButtonDisabled,
            ]}>
            {payingId === membership.id ? (
              <ActivityIndicator color={Brand.ink} />
            ) : (
              <>
                <Ionicons name="card-outline" size={19} color={Brand.ink} />
                <Text style={styles.payButtonText}>پرداخت امن با زرین‌پال</Text>
              </>
            )}
          </Pressable>
        </Surface>
      ))}

      <View style={styles.stats}>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>
            {successfulTotal.toLocaleString('fa-IR')}
          </Text>
          <Text style={styles.statLabel}>مجموع پرداخت موفق (تومان)</Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>{payments.length.toLocaleString('fa-IR')}</Text>
          <Text style={styles.statLabel}>تعداد تراکنش‌ها</Text>
        </Surface>
      </View>

      <Text style={styles.historyTitle}>تاریخچه تراکنش‌ها</Text>
      <Surface style={styles.historyCard}>
        {payments.map((payment) => (
          <PaymentItem key={payment.id} payment={payment} />
        ))}
        {!payments.length ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={34} color={Brand.muted} />
            <Text style={styles.emptyText}>هنوز تراکنشی ثبت نشده است.</Text>
          </View>
        ) : null}
      </Surface>
    </Screen>
  );
}

function PaymentItem({ payment }: { payment: AthletePayment }) {
  const success = payment.status === 'SUCCEEDED';
  const failed = payment.status === 'FAILED';
  return (
    <View style={styles.paymentItem}>
      <View
        style={[
          styles.paymentIcon,
          failed && styles.paymentIconFailed,
        ]}>
        <Ionicons
          name={success ? 'checkmark-circle' : failed ? 'close-circle' : 'time'}
          size={22}
          color={success ? Brand.emerald : failed ? Brand.danger : Brand.warning}
        />
      </View>
      <View style={styles.paymentCopy}>
        <Text style={styles.paymentTitle}>
          {payment.membership?.plan?.title ?? 'پرداخت باشگاه'}
        </Text>
        <Text style={styles.paymentMeta}>
          {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
            new Date(payment.paidAt ?? payment.createdAt),
          )}{' '}
          · {methodLabels[payment.method]}
        </Text>
        {payment.gatewayRef ? (
          <Text style={styles.reference}>پیگیری: {payment.gatewayRef}</Text>
        ) : null}
      </View>
      <View style={styles.amountCopy}>
        <Text style={styles.amount}>
          {Number(payment.amount).toLocaleString('fa-IR')}
        </Text>
        <Text
          style={[
            styles.paymentStatus,
            success && styles.paymentStatusSuccess,
            failed && styles.paymentStatusFailed,
          ]}>
          {statusLabels[payment.status]}
        </Text>
      </View>
    </View>
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
  errorCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    borderColor: '#F3CACA',
    backgroundColor: '#FFF7F7',
  },
  errorText: { flex: 1, color: Brand.danger, textAlign: 'right', fontSize: 12 },
  payableCard: { gap: 15, borderColor: '#BFD7C7', backgroundColor: '#FBFFF7' },
  payableTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  secureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  payableCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  payableTitle: { color: Brand.text, fontSize: 16, fontWeight: '900' },
  payableGym: { color: Brand.muted, fontSize: 11 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },
  price: { color: Brand.text, fontSize: 17, fontWeight: '900' },
  priceLabel: { color: Brand.muted, fontSize: 11 },
  payButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: Brand.lime,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payButtonPressed: { transform: [{ scale: 0.985 }] },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: Brand.ink, fontSize: 14, fontWeight: '900' },
  stats: { flexDirection: 'row-reverse', gap: 12 },
  statCard: { flex: 1, alignItems: 'flex-end', gap: 7, padding: 15 },
  statValue: { color: Brand.emerald, fontSize: 18, fontWeight: '900' },
  statLabel: { color: Brand.muted, fontSize: 9, textAlign: 'right' },
  historyTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  historyCard: { padding: 0, overflow: 'hidden' },
  paymentItem: {
    minHeight: 88,
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.line,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  paymentIconFailed: { backgroundColor: '#FFF0F0' },
  paymentCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  paymentTitle: { color: Brand.text, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  paymentMeta: { color: Brand.muted, fontSize: 9, textAlign: 'right' },
  reference: { color: Brand.muted, fontSize: 9, textAlign: 'right' },
  amountCopy: { alignItems: 'flex-start', gap: 5 },
  amount: { color: Brand.text, fontSize: 12, fontWeight: '900' },
  paymentStatus: { color: '#9B6810', fontSize: 9, fontWeight: '800' },
  paymentStatusSuccess: { color: Brand.emerald },
  paymentStatusFailed: { color: Brand.danger },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyText: { color: Brand.muted, fontSize: 12 },
});
