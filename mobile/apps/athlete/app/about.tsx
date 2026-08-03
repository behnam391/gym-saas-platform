import { ApiError } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
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

const website = 'https://app.gordyar.ir';

export default function AboutScreen() {
  const { session } = useSession();
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  function confirmDeletionRequest() {
    Alert.alert(
      'درخواست حذف حساب',
      'پس از ثبت درخواست، پشتیبانی برای احراز هویت و اعلام وضعیت داده‌های قابل حذف با شما تماس می‌گیرد. ادامه می‌دهید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'ثبت درخواست',
          style: 'destructive',
          onPress: requestDeletion,
        },
      ],
    );
  }

  async function requestDeletion() {
    setRequestingDeletion(true);
    try {
      await api.createPlatformTicket({
        subject: 'درخواست حذف حساب کاربری',
        description:
          'این درخواست توسط صاحب حساب از بخش حریم خصوصی اپ ورزشکار گُردیار ثبت شده است. لطفاً پس از احراز هویت، فرایند حذف یا ناشناس‌سازی داده‌های قابل حذف انجام شود.',
        priority: 'HIGH',
      });
      Alert.alert(
        'درخواست ثبت شد',
        'وضعیت درخواست را می‌توانید از بخش پشتیبانی پیگیری کنید.',
        [
          {
            text: 'مشاهده پشتیبانی',
            onPress: () => router.push('/support' as Href),
          },
          { text: 'باشه' },
        ],
      );
    } catch (cause) {
      Alert.alert(
        'ثبت انجام نشد',
        cause instanceof ApiError
          ? cause.message
          : 'لطفاً دوباره تلاش کنید.',
      );
    } finally {
      setRequestingDeletion(false);
    }
  }

  return (
    <Screen>
      <SectionTitle
        title="درباره گُردیار"
        hint="سامانه هوشمند انتخاب، عضویت و مدیریت خدمات ورزشی"
      />

      <Surface style={styles.intro}>
        <View style={styles.mark}>
          <Ionicons name="fitness" size={30} color={Brand.emerald} />
        </View>
        <View style={styles.introCopy}>
          <Text style={styles.name}>گُردیار ورزشکار</Text>
          <Text style={styles.description}>
            همراه ورزشکار برای عضویت باشگاه، ورود امن، برنامه تمرینی، پیشرفت،
            پرداخت و ارتباط با متخصصان.
          </Text>
        </View>
      </Surface>

      <Surface style={styles.links}>
        <PolicyLink
          icon="shield-checkmark-outline"
          title="سیاست حریم خصوصی"
          hint="اطلاعاتی که دریافت می‌شود و نحوه حفاظت از آن"
          onPress={() => WebBrowser.openBrowserAsync(`${website}/privacy`)}
        />
        <PolicyLink
          icon="document-text-outline"
          title="قوانین استفاده"
          hint="حقوق و مسئولیت‌های کاربران و ارائه‌دهندگان خدمات"
          onPress={() => WebBrowser.openBrowserAsync(`${website}/terms`)}
        />
        <PolicyLink
          icon="help-buoy-outline"
          title="مرکز پشتیبانی"
          hint="ثبت پرسش، مشکل یا درخواست درباره اطلاعات حساب"
          onPress={() => router.push('/support' as Href)}
        />
      </Surface>

      <Surface style={styles.privacyNote}>
        <Ionicons name="finger-print-outline" size={25} color={Brand.emerald} />
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>حفاظت از داده‌های زیستی</Text>
          <Text style={styles.privacyText}>
            تصویر خام چهره و الگوی خام اثر انگشت در گُردیار ذخیره نمی‌شود؛
            سامانه فقط شناسه لازم برای ارتباط امن با دستگاه حضور و غیاب را
            نگهداری می‌کند.
          </Text>
        </View>
      </Surface>

      {session ? (
        <Surface style={styles.deletion}>
          <View style={styles.deletionCopy}>
            <Text style={styles.deletionTitle}>حذف حساب و اطلاعات</Text>
            <Text style={styles.deletionText}>
              درخواست حذف یا ناشناس‌سازی داده‌های قابل حذف را ثبت کنید. سوابقی
              که نگهداری آن‌ها طبق قانون الزامی است تا پایان دوره قانونی حفظ
              می‌شوند.
            </Text>
          </View>
          <Pressable
            disabled={requestingDeletion}
            onPress={confirmDeletionRequest}
            style={styles.deleteButton}>
            {requestingDeletion ? (
              <ActivityIndicator size="small" color={Brand.danger} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color={Brand.danger} />
                <Text style={styles.deleteText}>درخواست حذف حساب</Text>
              </>
            )}
          </Pressable>
        </Surface>
      ) : null}
    </Screen>
  );
}

function PolicyLink({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  onPress(): void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.link}>
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={21} color={Brand.emerald} />
      </View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkHint}>{hint}</Text>
      </View>
      <Ionicons name="chevron-back" size={19} color={Brand.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  mark: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: { flex: 1, alignItems: 'flex-end', gap: 6 },
  name: { color: Brand.text, fontSize: 18, fontWeight: '900' },
  description: {
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'right',
  },
  links: { paddingVertical: 4 },
  link: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    minHeight: 70,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.line,
  },
  linkIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  linkTitle: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  linkHint: { color: Brand.muted, fontSize: 10, textAlign: 'right' },
  privacyNote: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    borderColor: '#BFD7C7',
  },
  privacyCopy: { flex: 1, alignItems: 'flex-end', gap: 6 },
  privacyTitle: { color: Brand.emerald, fontSize: 13, fontWeight: '900' },
  privacyText: {
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'right',
  },
  deletion: { gap: 14, borderColor: '#F2C7C2' },
  deletionCopy: { alignItems: 'flex-end', gap: 6 },
  deletionTitle: { color: Brand.danger, fontSize: 14, fontWeight: '900' },
  deletionText: {
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 20,
    textAlign: 'right',
  },
  deleteButton: {
    minHeight: 45,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F2C7C2',
    backgroundColor: '#FFF5F4',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  deleteText: { color: Brand.danger, fontSize: 12, fontWeight: '900' },
});
