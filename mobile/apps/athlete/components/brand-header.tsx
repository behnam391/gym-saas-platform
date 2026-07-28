import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';

export function BrandHeader() {
  const { session } = useSession();

  return (
    <View style={styles.wrap}>
      <Image
        source={require('@/assets/images/gordyar-logo.png')}
        contentFit="contain"
        style={styles.logo}
      />
      {session ? (
        <View style={styles.online}>
          <View style={styles.dot} />
          <Text style={styles.onlineText}>حساب فعال</Text>
        </View>
      ) : (
        <Link href="/sign-in" asChild>
          <Pressable style={styles.signIn}>
            <Text style={styles.signInText}>ورود</Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.surface,
  },
  logo: { width: 132, height: 42 },
  signIn: {
    backgroundColor: Brand.ink,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  signInText: { color: Brand.lime, fontWeight: '800', fontSize: 14 },
  online: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Brand.emerald },
  onlineText: { color: Brand.emerald, fontWeight: '700' },
});
