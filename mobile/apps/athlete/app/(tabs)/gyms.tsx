import type { GymSummary } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { GymCard } from '@/components/gym-card';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';

export default function GymsScreen() {
  const [gyms, setGyms] = useState<GymSummary[]>([]);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGyms(await api.searchGyms(city ? { city } : {}));
    } catch {
      setError('ارتباط با فهرست باشگاه‌ها برقرار نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen header={<BrandHeader />} refreshing={loading} onRefresh={load}>
      <SectionTitle title="باشگاه مناسب تو" hint="جستجو میان باشگاه‌های تاییدشده گُردیار" />
      <View style={styles.search}>
        <Ionicons name="search" size={20} color={Brand.muted} />
        <TextInput
          value={city}
          onChangeText={setCity}
          onSubmitEditing={load}
          placeholder="نام شهر یا شهرستان"
          placeholderTextColor="#98A39D"
          returnKeyType="search"
          style={styles.input}
        />
      </View>

      {error ? (
        <Surface>
          <Text style={styles.error}>{error}</Text>
        </Surface>
      ) : null}

      {!loading && !error && gyms.length === 0 ? (
        <Surface>
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={34} color={Brand.emerald} />
            <Text style={styles.emptyTitle}>هنوز باشگاهی نمایش داده نمی‌شود</Text>
            <Text style={styles.emptyText}>
              پس از تایید اولین باشگاه‌ها، آن‌ها را بر اساس موقعیت و امتیاز اینجا می‌بینید.
            </Text>
          </View>
        </Surface>
      ) : null}

      {gyms.map((gym) => (
        <GymCard gym={gym} key={gym.id} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 54,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 17,
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
  },
  input: { flex: 1, textAlign: 'right', color: Brand.text, fontSize: 14 },
  error: { color: Brand.danger, textAlign: 'right', lineHeight: 22 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  emptyTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: Brand.muted, fontSize: 12, lineHeight: 20, textAlign: 'center' },
});
