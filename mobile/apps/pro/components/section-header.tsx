import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  title: { color: Brand.text, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  subtitle: { color: Brand.muted, fontSize: 12, lineHeight: 20, textAlign: 'right' },
});
