import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, alignItems: 'flex-end' },
  title: { color: Brand.text, fontSize: 20, fontWeight: '900', textAlign: 'right' },
  hint: { color: Brand.muted, fontSize: 13, textAlign: 'right' },
});
