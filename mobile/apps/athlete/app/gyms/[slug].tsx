import type { AthleteMembership, GymDetails, MembershipPlanSummary } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

const imageWidth = Dimensions.get('window').width - 36;

export default function GymDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session, signOut } = useSession();
  const [gym, setGym] = useState<GymDetails | null>(null);
  const [memberships, setMemberships] = useState<AthleteMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingPlanId, setRequestingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const [gymData, membershipData] = await Promise.all([
        api.getGym(slug),
        session ? api.getMyMemberships().catch(() => []) : Promise.resolve([]),
      ]);
      setGym(gymData);
      setMemberships(membershipData);
    } catch {
      setError('اطلاعات باشگاه دریافت نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [session, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const selectPlan = async (plan: MembershipPlanSummary) => {
    if (!gym) return;
    if (!session) {
      router.push({
        pathname: '/register',
        params: { tenantId: gym.id, planId: plan.id },
      });
      return;
    }

    Alert.alert(
      'درخواست عضویت',
      `طرح «${plan.title}» از ${gym.name} انتخاب شود؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'ثبت درخواست',
          onPress: async () => {
            setRequestingPlanId(plan.id);
            try {
              const result = await api.requestMembership(gym.id, plan.id);
              Alert.alert('درخواست ثبت شد', result.message, [
                {
                  text: 'ورود دوباره',
                  onPress: async () => {
                    await signOut();
                    router.replace('/sign-in');
                  },
                },
              ]);
            } catch (reason) {
              const message =
                reason instanceof Error ? reason.message : 'ثبت درخواست عضویت انجام نشد.';
              Alert.alert('امکان ثبت درخواست نیست', message);
            } finally {
              setRequestingPlanId(null);
            }
          },
        },
      ],
    );
  };

  if (loading && !gym) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loading}>در حال دریافت اطلاعات باشگاه…</Text>
      </SafeAreaView>
    );
  }

  if (!gym || error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={35} color={Brand.danger} />
        <Text style={styles.error}>{error ?? 'باشگاه یافت نشد.'}</Text>
        <PrimaryButton title="تلاش دوباره" onPress={load} />
      </SafeAreaView>
    );
  }

  const images = gym.galleryImages?.length
    ? gym.galleryImages
    : gym.coverImageUrl
      ? [{ id: 'cover', url: gym.coverImageUrl, type: 'image' }]
      : [];
  const currentMembership = memberships.find((item) => item.tenant.slug === gym.slug);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {images.length ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}>
            {images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.url }}
                contentFit="cover"
                style={styles.cover}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Ionicons name="barbell" size={52} color={Brand.emerald} />
          </View>
        )}

        <Surface style={styles.summary}>
          <View style={styles.titleRow}>
            <View style={styles.score}>
              <Ionicons name="shield-checkmark" size={16} color={Brand.emerald} />
              <Text style={styles.scoreText}>{Math.round(gym.trustScore)}</Text>
            </View>
            <Text style={styles.title}>{gym.name}</Text>
          </View>
          <Text style={styles.location}>
            {[gym.address, gym.city, gym.province].filter(Boolean).join('، ')}
          </Text>
          {gym.description ? <Text style={styles.description}>{gym.description}</Text> : null}
        </Surface>

        <SectionTitle title="امکانات باشگاه" hint="خدماتی که در این مجموعه ارائه می‌شود" />
        <View style={styles.facilities}>
          {gym.facilities.map((facility) => (
            <View key={facility.id} style={styles.facility}>
              <Ionicons name="checkmark-circle" size={18} color={Brand.emerald} />
              <Text style={styles.facilityText}>{facility.name}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="طرح‌های عضویت" hint="طرح مناسب خودت را انتخاب کن" />
        {currentMembership ? (
          <Surface style={styles.currentMembership}>
            <Ionicons name="ribbon" size={25} color={Brand.emerald} />
            <View style={styles.currentCopy}>
              <Text style={styles.currentTitle}>عضویت شما در این باشگاه ثبت شده است</Text>
              <Text style={styles.currentText}>
                {currentMembership.plan.title} · وضعیت{' '}
                {currentMembership.status === 'ACTIVE' ? 'فعال' : 'در حال بررسی'}
              </Text>
            </View>
          </Surface>
        ) : null}

        <View style={styles.plans}>
          {gym.membershipPlans.map((plan) => (
            <Surface key={plan.id} style={styles.plan}>
              <View style={styles.planHeader}>
                <Text style={styles.duration}>{plan.durationDays} روز</Text>
                <Text style={styles.planTitle}>{plan.title}</Text>
              </View>
              <Text style={styles.price}>
                {Number(plan.price).toLocaleString('fa-IR')} تومان
              </Text>
              {plan.description ? (
                <Text style={styles.planDescription}>{plan.description}</Text>
              ) : null}
              <PrimaryButton
                title={
                  currentMembership
                    ? 'عضویت ثبت شده'
                    : session
                      ? 'انتخاب این طرح'
                      : 'ثبت‌نام و انتخاب طرح'
                }
                disabled={Boolean(currentMembership)}
                loading={requestingPlanId === plan.id}
                onPress={() => selectPlan(plan)}
              />
            </Surface>
          ))}
        </View>

        {gym.trainers.length || gym.nutritionists.length ? (
          <>
            <SectionTitle title="تیم حرفه‌ای" hint="متخصصان تاییدشده این باشگاه" />
            {[...gym.trainers, ...gym.nutritionists].map((professional) => (
              <Surface key={professional.id} style={styles.professional}>
                <View style={styles.professionalIcon}>
                  <Ionicons name="person" size={22} color={Brand.emerald} />
                </View>
                <View style={styles.professionalCopy}>
                  <Text style={styles.professionalName}>{professional.name}</Text>
                  <Text style={styles.professionalSpecialty}>{professional.specialty}</Text>
                </View>
              </Surface>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 18, paddingBottom: 60, gap: 18 },
  center: {
    flex: 1,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 28,
  },
  loading: { color: Brand.muted, fontWeight: '700' },
  error: { color: Brand.danger, textAlign: 'center' },
  gallery: { gap: 10 },
  cover: { width: imageWidth, height: 230, borderRadius: 25 },
  coverFallback: { backgroundColor: '#E9F4EC', alignItems: 'center', justifyContent: 'center' },
  summary: { gap: 11 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, color: Brand.text, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E9F4EC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  scoreText: { color: Brand.emerald, fontWeight: '900' },
  location: { color: Brand.muted, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  description: { color: Brand.text, fontSize: 13, lineHeight: 23, textAlign: 'right' },
  facilities: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9 },
  facility: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.card,
    borderColor: Brand.line,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  facilityText: { color: Brand.text, fontSize: 12, fontWeight: '700' },
  currentMembership: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    borderColor: '#BFD7C7',
    backgroundColor: '#F7FBF7',
  },
  currentCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  currentTitle: { color: Brand.text, fontWeight: '900', textAlign: 'right' },
  currentText: { color: Brand.muted, fontSize: 11, textAlign: 'right' },
  plans: { gap: 12 },
  plan: { gap: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { color: Brand.text, fontWeight: '900', fontSize: 16 },
  duration: { color: Brand.emerald, fontWeight: '800', fontSize: 12 },
  price: { color: Brand.emerald, fontSize: 21, fontWeight: '900', textAlign: 'right' },
  planDescription: { color: Brand.muted, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  professional: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 13 },
  professionalIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  professionalCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  professionalName: { color: Brand.text, fontWeight: '900' },
  professionalSpecialty: { color: Brand.muted, fontSize: 11 },
});
