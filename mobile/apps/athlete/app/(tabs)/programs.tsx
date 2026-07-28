import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';

const services = [
  {
    icon: 'barbell-outline' as const,
    title: 'برنامه تمرینی',
    text: 'تمرین‌های روزانه، تعداد ست‌ها و ثبت عملکرد',
  },
  {
    icon: 'nutrition-outline' as const,
    title: 'برنامه غذایی',
    text: 'وعده‌ها و توصیه‌های اختصاصی مشاور تغذیه',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'مشاوره آنلاین',
    text: 'گفت‌وگو با مربی و متخصصان تاییدشده گُردیار',
  },
];

export default function ProgramsScreen() {
  const { session } = useSession();

  return (
    <Screen header={<BrandHeader />}>
      <SectionTitle title="برنامه‌های من" hint="تمرین، تغذیه و مشاوره در یک مسیر منظم" />

      {!session ? (
        <Surface style={styles.guest}>
          <View style={styles.heroIcon}>
            <Ionicons name="fitness" size={30} color={Brand.emerald} />
          </View>
          <Text style={styles.guestTitle}>برنامه شخصی تو بعد از ورود نمایش داده می‌شود</Text>
          <Text style={styles.guestText}>
            برنامه‌های دریافتی از مربی و مشاور، گزارش اجرای تمرین و روند پیشرفت در حساب تو
            نگهداری می‌شود.
          </Text>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.loginButton}>
              <Text style={styles.loginButtonText}>ورود به حساب ورزشکاری</Text>
            </Pressable>
          </Link>
        </Surface>
      ) : (
        <Surface style={styles.today}>
          <View style={styles.todayHeader}>
            <View style={styles.readyBadge}>
              <Text style={styles.readyText}>امروز</Text>
            </View>
            <Text style={styles.todayTitle}>برنامه فعالی ثبت نشده است</Text>
          </View>
          <Text style={styles.todayText}>
            پس از دریافت برنامه از مربی یا مشاور، جزئیات جلسه امروز اینجا قرار می‌گیرد.
          </Text>
        </Surface>
      )}

      <View style={styles.list}>
        {services.map((service) => (
          <Surface key={service.title} style={styles.service}>
            <View style={styles.serviceIcon}>
              <Ionicons name={service.icon} size={23} color={Brand.emerald} />
            </View>
            <View style={styles.serviceCopy}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceText}>{service.text}</Text>
            </View>
            <Ionicons name="chevron-back" size={19} color={Brand.muted} />
          </Surface>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: { alignItems: 'center', gap: 11, paddingVertical: 24 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  guestTitle: { color: Brand.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  guestText: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 310,
  },
  loginButton: {
    marginTop: 7,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: Brand.lime,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: { color: Brand.ink, fontWeight: '900' },
  today: { gap: 10 },
  todayHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayTitle: { color: Brand.text, fontWeight: '900', fontSize: 15 },
  readyBadge: {
    borderRadius: 999,
    backgroundColor: '#E9F4EC',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  readyText: { color: Brand.emerald, fontSize: 11, fontWeight: '900' },
  todayText: { color: Brand.muted, textAlign: 'right', fontSize: 12, lineHeight: 20 },
  list: { gap: 11 },
  service: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  serviceTitle: { color: Brand.text, fontWeight: '900', fontSize: 14 },
  serviceText: { color: Brand.muted, fontSize: 11, textAlign: 'right', lineHeight: 18 },
});
