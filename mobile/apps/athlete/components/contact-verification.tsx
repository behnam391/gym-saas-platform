import type { OtpChannel } from '@gordyar/mobile-core';
import { ApiError } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { toLatinDigits } from '@/lib/digits';
import { FormField } from './form-field';
import { PrimaryButton } from './primary-button';
import { Surface } from './screen';

type Props = {
  mobile: string;
  email?: string;
  onVerified(token: string | null): void;
};

export function ContactVerification({
  mobile,
  email = '',
  onVerified,
}: Props) {
  const [channel, setChannel] = useState<OtpChannel>('SMS');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verifiedDestination, setVerifiedDestination] = useState<string | null>(
    null,
  );
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [, setClock] = useState(0);

  const destination = useMemo(
    () =>
      channel === 'SMS'
        ? toLatinDigits(mobile.trim())
        : email.trim().toLowerCase(),
    [channel, email, mobile],
  );

  useEffect(() => {
    if (verifiedDestination && verifiedDestination !== destination) {
      setVerifiedDestination(null);
      setChallengeId(null);
      setCode('');
      onVerified(null);
    }
  }, [destination, onVerified, verifiedDestination]);

  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => setClock(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [retryAt]);

  const retrySeconds = Math.max(
    0,
    Math.ceil((retryAt - Date.now()) / 1_000),
  );

  function changeChannel(next: OtpChannel) {
    setChannel(next);
    setChallengeId(null);
    setVerifiedDestination(null);
    setCode('');
    setMessage(null);
    setError(null);
    onVerified(null);
  }

  async function requestCode() {
    setBusy(true);
    setError(null);
    setMessage(null);
    onVerified(null);
    try {
      const result = await api.requestOtp(channel, destination);
      setChallengeId(result.challengeId);
      setRetryAt(Date.now() + result.retryAfterSeconds * 1_000);
      setMessage(
        result.debugCode
          ? `${result.message} کد آزمایشی: ${result.debugCode}`
          : result.message,
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'ارسال کد انجام نشد؛ اتصال اینترنت را بررسی کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!challengeId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.verifyOtp(
        challengeId,
        toLatinDigits(code),
      );
      setVerifiedDestination(result.destination);
      onVerified(result.verificationToken);
      setMessage(result.message);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'بررسی کد انجام نشد؛ دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>تأیید شماره یا ایمیل</Text>
          <Text style={styles.hint}>کد شش‌رقمی تا ۵ دقیقه معتبر است.</Text>
        </View>
        {verifiedDestination ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={18} color={Brand.emerald} />
            <Text style={styles.verifiedText}>تأیید شد</Text>
          </View>
        ) : null}
      </View>

      {!verifiedDestination ? (
        <>
          <View style={styles.channels}>
            {([
              ['SMS', 'پیامک', 'chatbox-outline'],
              ['EMAIL', 'ایمیل', 'mail-outline'],
            ] as [OtpChannel, string, keyof typeof Ionicons.glyphMap][]).map(
              ([value, label, icon]) => (
                <Pressable
                  key={value}
                  onPress={() => changeChannel(value)}
                  style={[
                    styles.channel,
                    channel === value && styles.channelActive,
                  ]}>
                  <Ionicons
                    name={icon}
                    size={18}
                    color={channel === value ? Brand.emerald : Brand.muted}
                  />
                  <Text
                    style={[
                      styles.channelText,
                      channel === value && styles.channelTextActive,
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          {challengeId ? (
            <>
              <FormField
                label="کد تأیید"
                icon="keypad-outline"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(value) =>
                  setCode(toLatinDigits(value).replace(/\D/g, '').slice(0, 6))
                }
                placeholder="کد شش‌رقمی"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
              <PrimaryButton
                title="تأیید کد"
                onPress={verifyCode}
                loading={busy}
                disabled={code.length !== 6}
              />
              <Pressable
                disabled={busy || retrySeconds > 0}
                onPress={requestCode}>
                <Text
                  style={[
                    styles.resend,
                    retrySeconds > 0 && styles.resendDisabled,
                  ]}>
                  {retrySeconds > 0
                    ? `ارسال مجدد تا ${retrySeconds} ثانیه دیگر`
                    : 'ارسال مجدد کد'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.destination}>
                <Text style={styles.destinationText}>
                  {destination ||
                    (channel === 'SMS'
                      ? 'ابتدا شماره موبایل را وارد کنید.'
                      : 'ابتدا ایمیل را وارد کنید.')}
                </Text>
              </View>
              <PrimaryButton
                title="ارسال کد تأیید"
                onPress={requestCode}
                loading={busy}
                disabled={!destination}
              />
            </>
          )}
        </>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: 13, borderColor: '#BFD7C7' },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  title: { color: Brand.text, fontWeight: '900', fontSize: 14 },
  hint: { color: Brand.muted, fontSize: 11 },
  verified: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E9F4EC',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  verifiedText: { color: Brand.emerald, fontSize: 10, fontWeight: '900' },
  channels: { flexDirection: 'row-reverse', gap: 8 },
  channel: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 13,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  channelActive: { borderColor: Brand.emerald, backgroundColor: '#E9F4EC' },
  channelText: { color: Brand.muted, fontWeight: '800', fontSize: 12 },
  channelTextActive: { color: Brand.emerald },
  destination: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: Brand.surface,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  destinationText: { color: Brand.muted, textAlign: 'right', fontSize: 12 },
  resend: {
    color: Brand.emerald,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
  },
  resendDisabled: { color: Brand.muted },
  message: {
    color: Brand.emerald,
    backgroundColor: '#E9F4EC',
    borderRadius: 11,
    padding: 10,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 18,
  },
  error: {
    color: Brand.danger,
    backgroundColor: '#FFF0F0',
    borderRadius: 11,
    padding: 10,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 18,
  },
});
