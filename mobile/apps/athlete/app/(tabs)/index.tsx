import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';

const actions = [
  { icon: 'qr-code-outline' as const, label: 'ورود سریع', href: '/pass' as const },
  { icon: 'barbell-outline' as const, label: 'برنامه من', href: '/programs' as const },
  { icon: 'search-outline' as const, label: 'باشگاه‌ها', href: '/gyms' as const },
  { icon: 'chatbubbles-outline' as const, label: 'مشاوره', href: '/programs' as const },
];

export default function HomeScreen() {
  const { session } = useSession();

  return (
    <Screen header={<BrandHeader />} contentStyle={styles.content}>
      <LinearGradient
        colors={[Brand.inkSoft, Brand.ink]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroBadge}>
          <View style={styles.heroDot} />
          <Text style={styles.heroBadgeText}>مسیر قهرمانی تو</Text>
        </View>
        <Text style={styles.heroTitle}>امروز برای خودت{"\n"}یک قدم بردار</Text>
        <Text style={styles.heroText}>
          باشگاه، برنامه و روند پیشرفتت همیشه همراه توست.
        </Text>
        {!session ? (
          <Link href="/sign-in" asChild>
            <Pressable style={styles.heroButton}>
              <Ionicons name="arrow-back" size={18} color={Brand.ink} />
              <Text style={styles.heroButtonText}>ورود به حساب ورزشکاری</Text>
            </Pressable>
          </Link>
        ) : null}
      </LinearGradient>

      <View style={styles.actions}>
        {actions.map((action) => (
          <Link href={action.href} asChild key={action.label}>
            <Pressable style={styles.action}>
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={23} color={Brand.emerald} />
              </View>
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <SectionTitle title="وضعیت امروز" hint="خلاصه فعالیت و عضویت شما" />
      <View style={styles.stats}>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>۰</Text>
          <Text style={styles.statLabel}>جلسه این هفته</Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>اعتبار عضویت</Text>
        </Surface>
      </View>

      <Surface>
        <View style={styles.noticeHeader}>
          <View style={styles.noticeIcon}>
            <Ionicons name="shield-checkmark" size={22} color={Brand.emerald} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>پرونده ورزشی امن</Text>
            <Text style={styles.noticeText}>
              سوابق عضویت، بیمه و ورودهای شما فقط برای افراد مجاز نمایش داده می‌شود.
            </Text>
          </View>
        </View>
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 4 },
  hero: { borderRadius: 28, padding: 22, minHeight: 260, alignItems: 'flex-end' },
  heroBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.lime },
  heroBadgeText: { color: '#D9E4DE', fontSize: 12, fontWeight: '700' },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 43,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 18,
  },
  heroText: { color: '#B8C7C0', fontSize: 14, lineHeight: 24, textAlign: 'right', marginTop: 8 },
  heroButton: {
    marginTop: 20,
    backgroundColor: Brand.lime,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 17,
  },
  heroButtonText: { color: Brand.ink, fontSize: 14, fontWeight: '900' },
  actions: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8 },
  action: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: Brand.text, fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row-reverse', gap: 12 },
  statCard: { flex: 1 },
  statValue: { color: Brand.emerald, fontSize: 25, fontWeight: '900', textAlign: 'right' },
  statLabel: { color: Brand.muted, fontSize: 12, textAlign: 'right', marginTop: 4 },
  noticeHeader: { flexDirection: 'row-reverse', gap: 12, alignItems: 'flex-start' },
  noticeIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  noticeCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  noticeTitle: { color: Brand.text, fontWeight: '900', fontSize: 15 },
  noticeText: { color: Brand.muted, fontSize: 12, lineHeight: 20, textAlign: 'right' },
});
