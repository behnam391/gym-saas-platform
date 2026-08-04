import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function Badge({
  children,
  tone = 'muted',
}: PropsWithChildren<{ tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted' }>) {
  return (
    <View style={[styles.base, styles[`${tone}Box`]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  text: { fontSize: 10, fontWeight: '900' },
  successBox: { backgroundColor: Brand.emeraldSoft },
  successText: { color: Brand.emerald },
  warningBox: { backgroundColor: Brand.warningSoft },
  warningText: { color: '#9A5D00' },
  dangerBox: { backgroundColor: Brand.dangerSoft },
  dangerText: { color: Brand.danger },
  infoBox: { backgroundColor: Brand.infoSoft },
  infoText: { color: Brand.info },
  mutedBox: { backgroundColor: '#EDF0ED' },
  mutedText: { color: Brand.muted },
});
