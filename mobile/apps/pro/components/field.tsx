import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Brand } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
};

export const Field = forwardRef<TextInput, Props>(function Field(
  { label, icon, error, style, multiline, ...props },
  ref,
) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, multiline && styles.multiline, error && styles.boxError]}>
        {icon ? <Ionicons name={icon} size={19} color={Brand.muted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#98A39D"
          textAlign="right"
          multiline={multiline}
          style={[styles.input, multiline && styles.multilineInput, style]}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: { color: Brand.text, fontWeight: '800', fontSize: 12, textAlign: 'right' },
  box: {
    minHeight: 52,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.card,
    paddingHorizontal: 14,
  },
  multiline: { alignItems: 'flex-start', paddingTop: 13 },
  input: { flex: 1, color: Brand.text, fontSize: 14, minHeight: 48 },
  multilineInput: { minHeight: 90, textAlignVertical: 'top' },
  boxError: { borderColor: Brand.danger },
  error: { color: Brand.danger, fontSize: 11, textAlign: 'right' },
});
