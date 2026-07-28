import type { GymSummary } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function GymCard({ gym }: { gym: GymSummary }) {
  const image = gym.coverImageUrl ?? gym.galleryImages?.[0]?.url;
  const price = gym.membershipPlans?.length
    ? Math.min(...gym.membershipPlans.map((plan) => Number(plan.price)))
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/gyms/[slug]', params: { slug: gym.slug } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {image ? (
        <Image source={{ uri: image }} contentFit="cover" style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons name="barbell" size={34} color={Brand.emerald} />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.score}>
            <Ionicons name="shield-checkmark" size={14} color={Brand.emerald} />
            <Text style={styles.scoreText}>{Math.round(gym.trustScore ?? 0)}</Text>
          </View>
          <Text style={styles.title}>{gym.name}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={15} color={Brand.muted} />
          <Text style={styles.location}>
            {[gym.city, gym.county, gym.province].filter(Boolean).join('، ') || 'موقعیت ثبت نشده'}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.cta}>مشاهده باشگاه</Text>
          <Text style={styles.price}>
            {price === null ? 'استعلام قیمت' : `از ${price.toLocaleString('fa-IR')} تومان`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 23,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  image: { width: '100%', height: 150 },
  imageFallback: {
    width: '100%',
    height: 150,
    backgroundColor: '#E7F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 16, gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Brand.text, fontWeight: '900', fontSize: 17, textAlign: 'right', flex: 1 },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E9F4EC',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  scoreText: { color: Brand.emerald, fontWeight: '800', fontSize: 11 },
  locationRow: { flexDirection: 'row-reverse', gap: 5, alignItems: 'center' },
  location: { color: Brand.muted, fontSize: 12, textAlign: 'right' },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cta: { color: Brand.emerald, fontSize: 12, fontWeight: '800' },
  price: { color: Brand.text, fontSize: 12, fontWeight: '700' },
});
