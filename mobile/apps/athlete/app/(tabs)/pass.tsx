import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';

const matrix = Array.from({ length: 100 }, (_, index) => {
  const row = Math.floor(index / 10);
  const column = index % 10;
  const inCorner =
    (row < 4 && column < 4) ||
    (row < 4 && column > 5) ||
    (row > 5 && column < 4);
  return inCorner || (row * 7 + column * 11 + row * column) % 5 < 2 ? 1 : 0;
});

export default function PassScreen() {
  const { session } = useSession();

  return (
    <Screen header={<BrandHeader />}>
      <SectionTitle title="ورود سریع به باشگاه" hint="کد پویا برای ثبت امن حضور" />
      <Surface>
        <View style={styles.pass}>
          <View style={styles.passTop}>
            <View style={styles.live}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{session ? 'آماده اسکن' : 'نیازمند ورود'}</Text>
            </View>
            <Text style={styles.passBrand}>GORDYAR PASS</Text>
          </View>
          <View style={[styles.qr, !session && styles.qrDisabled]}>
            {matrix.map((cell, index) => (
              <View
                key={index}
                style={[styles.qrCell, { backgroundColor: cell ? Brand.ink : '#FFFFFF' }]}
              />
            ))}
          </View>
          <Text style={styles.code}>{session ? '۴۸۲ ۹۱۵' : '— — —'}</Text>
          <Text style={styles.expiry}>
            {session ? 'این کد هر ۳۰ ثانیه تغییر می‌کند' : 'برای دریافت کد پویا وارد حساب شوید'}
          </Text>
          {!session ? (
            <Link href="/sign-in" asChild>
              <Pressable style={styles.signIn}>
                <Text style={styles.signInText}>ورود به حساب</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </Surface>

      <View style={styles.methods}>
        <View style={styles.method}>
          <Ionicons name="phone-portrait-outline" size={22} color={Brand.emerald} />
          <Text style={styles.methodTitle}>NFC موبایل</Text>
          <Text style={styles.methodText}>در Development Build فعال می‌شود</Text>
        </View>
        <View style={styles.method}>
          <Ionicons name="card-outline" size={22} color={Brand.emerald} />
          <Text style={styles.methodTitle}>کارت باشگاه</Text>
          <Text style={styles.methodText}>متصل به همین حساب ورزشکاری</Text>
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
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.emerald },
  liveText: { color: Brand.emerald, fontSize: 11, fontWeight: '800' },
  qr: {
    width: 190,
    height: 190,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Brand.ink,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qrDisabled: { opacity: 0.18 },
  qrCell: { width: '10%', height: '10%' },
  code: { marginTop: 18, color: Brand.text, fontSize: 26, fontWeight: '900', letterSpacing: 4 },
  expiry: { marginTop: 5, color: Brand.muted, fontSize: 12 },
  signIn: {
    marginTop: 18,
    backgroundColor: Brand.lime,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  signInText: { color: Brand.ink, fontWeight: '900' },
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
