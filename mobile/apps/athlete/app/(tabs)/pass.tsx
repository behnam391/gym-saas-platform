import type { AttendancePass } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { BrandHeader } from '@/components/brand-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

export default function PassScreen() {
  usePreventScreenCapture('gordyar-attendance-pass');
  const { session } = useSession();
  const [pass, setPass] = useState<AttendancePass | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPass = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const next = await api.getAttendancePass();
      setPass(next);
      setNow(Date.now());
      if (nextRefreshRef.current) clearTimeout(nextRefreshRef.current);
      nextRefreshRef.current = setTimeout(() => {
        loadPass();
      }, Math.max(5_000, new Date(next.expiresAt).getTime() - Date.now() - 4_000));
    } catch (reason) {
      setPass(null);
      setError(
        reason instanceof Error
          ? reason.message
          : 'گُردیار Pass در حال حاضر صادر نشد.',
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) loadPass();
    else {
      setPass(null);
      setError(null);
    }
    return () => {
      if (nextRefreshRef.current) clearTimeout(nextRefreshRef.current);
    };
  }, [loadPass, session]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!pass) return 0;
    return Math.max(0, Math.ceil((new Date(pass.expiresAt).getTime() - now) / 1_000));
  }, [now, pass]);

  const progress = Math.max(0, Math.min(100, (secondsLeft / 30) * 100));

  return (
    <Screen header={<BrandHeader />}>
      <SectionTitle
        title="گُردیار Pass"
        hint="کد یک‌بارمصرف برای ثبت امن ورود و خروج"
      />
      <Surface>
        <View style={styles.pass}>
          <View style={styles.passTop}>
            <View style={[styles.live, !pass && styles.liveInactive]}>
              <View style={[styles.liveDot, !pass && styles.liveDotInactive]} />
              <Text style={[styles.liveText, !pass && styles.liveTextInactive]}>
                {pass ? `${secondsLeft} ثانیه` : session ? 'غیرفعال' : 'نیازمند ورود'}
              </Text>
            </View>
            <Text style={styles.passBrand}>GORDYAR PASS</Text>
          </View>

          {pass ? (
            <>
              <View style={styles.qr}>
                <QRCode
                  value={pass.token}
                  size={190}
                  backgroundColor="#FFFFFF"
                  color={Brand.ink}
                  quietZone={8}
                />
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressValue, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.athleteName}>{pass.athleteName}</Text>
              <Text style={styles.gymName}>{pass.gym.name}</Text>
              <Text style={styles.planName}>{pass.planTitle}</Text>
              <Text style={styles.expiry}>
                کد به‌صورت خودکار تغییر می‌کند و فقط یک‌بار قابل استفاده است.
              </Text>
            </>
          ) : (
            <View style={styles.emptyPass}>
              <View style={styles.lockIcon}>
                <Ionicons
                  name={session ? 'refresh' : 'lock-closed'}
                  size={35}
                  color={Brand.emerald}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {session ? 'Pass آماده نیست' : 'ابتدا وارد حساب ورزشکاری شوید'}
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {session ? (
                <PrimaryButton
                  title="دریافت دوباره Pass"
                  onPress={loadPass}
                  loading={loading}
                />
              ) : (
                <Link href="/sign-in" asChild>
                  <Pressable style={styles.signIn}>
                    <Text style={styles.signInText}>ورود به حساب</Text>
                  </Pressable>
                </Link>
              )}
            </View>
          )}
        </View>
      </Surface>

      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={22} color={Brand.emerald} />
        <View style={styles.securityCopy}>
          <Text style={styles.securityTitle}>محافظت فعال</Text>
          <Text style={styles.securityText}>
            اسکرین‌شات این صفحه مسدود است و هر کد پس از اسکن یا پایان زمان باطل می‌شود.
          </Text>
        </View>
      </View>

      <View style={styles.methods}>
        <View style={styles.method}>
          <Ionicons name="phone-portrait-outline" size={22} color={Brand.emerald} />
          <Text style={styles.methodTitle}>NFC موبایل</Text>
          <Text style={styles.methodText}>در Development Build فعال خواهد شد</Text>
        </View>
        <View style={styles.method}>
          <Ionicons name="qr-code-outline" size={22} color={Brand.emerald} />
          <Text style={styles.methodTitle}>QR پویا</Text>
          <Text style={styles.methodText}>آماده اسکن توسط پذیرش و دستگاه</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pass: { alignItems: 'center' },
  passTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  passBrand: { color: Brand.muted, fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF5ED',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveInactive: { backgroundColor: '#F0F1EE' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.emerald },
  liveDotInactive: { backgroundColor: Brand.muted },
  liveText: { color: Brand.emerald, fontSize: 11, fontWeight: '800' },
  liveTextInactive: { color: Brand.muted },
  qr: {
    padding: 8,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Brand.ink,
  },
  progressTrack: {
    width: 210,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.line,
    overflow: 'hidden',
    marginTop: 15,
  },
  progressValue: { height: '100%', backgroundColor: Brand.emerald },
  athleteName: { marginTop: 17, color: Brand.text, fontSize: 18, fontWeight: '900' },
  gymName: { marginTop: 6, color: Brand.emerald, fontSize: 14, fontWeight: '800' },
  planName: { marginTop: 3, color: Brand.muted, fontSize: 12 },
  expiry: {
    marginTop: 12,
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyPass: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 13 },
  lockIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  emptyTitle: { color: Brand.text, fontWeight: '900', textAlign: 'center' },
  error: { color: Brand.danger, fontSize: 11, lineHeight: 18, textAlign: 'center' },
  signIn: {
    marginTop: 5,
    backgroundColor: Brand.lime,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  signInText: { color: Brand.ink, fontWeight: '900' },
  securityNotice: {
    flexDirection: 'row-reverse',
    gap: 11,
    borderRadius: 18,
    backgroundColor: '#E9F4EC',
    padding: 15,
    alignItems: 'flex-start',
  },
  securityCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  securityTitle: { color: Brand.emerald, fontWeight: '900', fontSize: 13 },
  securityText: { color: Brand.muted, fontSize: 11, lineHeight: 18, textAlign: 'right' },
  methods: { flexDirection: 'row-reverse', gap: 12 },
  method: {
    flex: 1,
    backgroundColor: Brand.card,
    borderColor: Brand.line,
    borderWidth: 1,
    borderRadius: 19,
    padding: 16,
    alignItems: 'flex-end',
    gap: 7,
  },
  methodTitle: { color: Brand.text, fontWeight: '900', textAlign: 'right' },
  methodText: { color: Brand.muted, fontSize: 11, lineHeight: 18, textAlign: 'right' },
});
