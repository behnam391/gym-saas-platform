import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { Button } from './button';

export function LoadingState({ label = 'در حال دریافت اطلاعات…' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={Brand.emerald} size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="file-tray-outline" size={28} color={Brand.emerald} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.text}>{description}</Text> : null}
      {action ? <Button title={action.title} onPress={action.onPress} variant="secondary" compact /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 30, alignItems: 'center', gap: 10 },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.emeraldSoft,
  },
  title: { color: Brand.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  text: { color: Brand.muted, fontSize: 12, lineHeight: 20, textAlign: 'center' },
});
