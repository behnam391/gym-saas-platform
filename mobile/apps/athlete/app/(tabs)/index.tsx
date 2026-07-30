import type { AthleteProfileSummary, AthleteProgress } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

const actions = [
  { icon: 'qr-code-outline' as const, label: 'ورود سریع', href: '/pass' as const },
  { icon: 'barbell-outline' as const, label: 'برنامه من', href: '/programs' as const },
  { icon: 'search-outline' as const, label: 'باشگاه‌ها', href: '/gyms' as const },
  { icon: 'trending-up-outline' as const, label: 'پیشرفت', href: '/progress' as Href },
];

export default function HomeScreen() {
  const { session } = useSession();
  const [progress, setProgress] = useState<AthleteProgress | null>(null);
  const [profile, setProfile] = useState<AthleteProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [nextProgress, nextProfile] = await Promise.all([
        api.getMyProgress(),
        api.getMyProfile(),
      ]);
      setProgress(nextProgress);
      setProfile(nextProfile);
    } catch {
      // Each detailed screen has its own retry state. The home summary remains usable offline.
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const membership = profile?.memberships.find((item) => item.status === 'ACTIVE')
    ?? profile?.memberships[0];
  const remainingDays = membership?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <Screen
      header={<BrandHeader />}
      contentStyle={styles.content}
      refreshing={loading}
      onRefresh={session ? loadDashboard : undefined}>
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
        ) : (
          <View style={styles.memberGreeting}>
            <Ionicons name="checkmark-circle" size={18} color={Brand.lime} />
            <Text style={styles.memberGreetingText}>
              {profile ? `سلام ${profile.firstName}` : 'حساب ورزشکاری فعال'}
            </Text>
          </View>
        )}
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

      <SectionTitle title="وضعیت امروز" hint="خلاصه زنده فعالیت و عضویت شما" />
      <View style={styles.stats}>
        <StatCard
          value={progress?.attendanceLast30Days?.toLocaleString('fa-IR') ?? '۰'}
          label="حضور در ۳۰ روز"
          icon="calendar-outline"
        />
        <StatCard
          value={
            remainingDays !== null
              ? remainingDays.toLocaleString('fa-IR')
              : membership?.status === 'ACTIVE' ? 'فعال' : '—'
          }
          label={remainingDays !== null ? 'روز اعتبار عضویت' : 'وضعیت عضویت'}
          icon="card-outline"
        />
      </View>
      <View style={styles.stats}>
        <StatCard
          value={
            progress?.latestMeasurement?.weightKg != null
              ? `${progress.latestMeasurement.weightKg.toLocaleString('fa-IR')} ک`
              : '—'
          }
          label="آخرین وزن"
          icon="scale-outline"
        />
        <StatCard
          value={
            progress
              ? (progress.activePrograms + progress.activeDiets).toLocaleString('fa-IR')
              : '۰'
          }
          label="برنامه فعال"
          icon="fitness-outline"
        />
      </View>

      {session ? (
        <Link href={'/progress' as Href} asChild>
          <Pressable>
            <Surface style={styles.progressCard}>
              <View style={styles.progressIcon}>
                <Ionicons name="analytics-outline" size={24} color={Brand.emerald} />
              </View>
              <View style={styles.progressCopy}>
                <Text style={styles.progressTitle}>روند پیشرفت من</Text>
                <Text style={styles.progressText}>
                  وزن، اندازه‌های بدن و هدف‌های ورزشی را ثبت و دنبال کن.
                </Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={Brand.muted} />
            </Surface>
          </Pressable>
        </Link>
      ) : null}

      <Surface>
        <View style={styles.noticeHeader}>
          <View style={styles.noticeIcon}>
            <Ionicons name="shield-checkmark" size={22} color={Brand.emerald} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>پرونده ورزشی امن</Text>
            <Text style={styles.noticeText}>
              سوابق عضویت، اندازه‌ها و ورودهای شما فقط برای افراد مجاز نمایش داده می‌شود.
            </Text>
          </View>
        </View>
      </Surface>
    </Screen>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Surface style={styles.statCard}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={18} color={Brand.emerald} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </Surface>
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
  heroText: {
    color: '#B8C7C0',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    marginTop: 8,
  },
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
  memberGreeting: {
    marginTop: 20,
    minHeight: 43,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  memberGreetingText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
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
  statCard: { flex: 1, padding: 15 },
  statTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: { color: Brand.emerald, fontSize: 21, fontWeight: '900', textAlign: 'right' },
  statLabel: { color: Brand.muted, fontSize: 11, textAlign: 'right', marginTop: 7 },
  progressCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  progressTitle: { color: Brand.text, fontSize: 14, fontWeight: '900' },
  progressText: { color: Brand.muted, fontSize: 11, lineHeight: 18, textAlign: 'right' },
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
