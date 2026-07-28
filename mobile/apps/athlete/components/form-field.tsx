import Ionicons from '@expo/vector-icons/Ionicons';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Brand } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function FormField({ label, icon, error, containerStyle, style, ...inputProps }: Props) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {icon ? <Ionicons name={icon} size={20} color={Brand.muted} /> : null}
        <TextInput
          {...inputProps}
          style={[styles.input, style]}
          placeholderTextColor="#98A39D"
          textAlign="right"
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  label: { color: Brand.text, fontWeight: '800', fontSize: 13, textAlign: 'right' },
  field: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.card,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
  },
  fieldError: { borderColor: Brand.danger },
  input: { flex: 1, color: Brand.text, fontSize: 15, minHeight: 52 },
  error: { color: Brand.danger, fontSize: 11, textAlign: 'right' },
});
