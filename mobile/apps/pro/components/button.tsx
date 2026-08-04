import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  compact?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  icon,
  loading,
  disabled,
  variant = 'primary',
  compact,
  style,
}: Props) {
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        styles[variant],
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? Brand.emerald : Brand.ink} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'secondary' ? Brand.emerald : variant === 'danger' ? '#fff' : Brand.ink}
            />
          ) : null}
          <Text
            style={[
              styles.text,
              variant === 'secondary' && styles.secondaryText,
              variant === 'danger' && styles.dangerText,
            ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compact: { minHeight: 39, borderRadius: 12, paddingHorizontal: 12 },
  primary: { backgroundColor: Brand.lime },
  secondary: { backgroundColor: Brand.emeraldSoft, borderWidth: 1, borderColor: '#CBE5DB' },
  danger: { backgroundColor: Brand.danger },
  text: { color: Brand.ink, fontWeight: '900', fontSize: 13 },
  secondaryText: { color: Brand.emerald },
  dangerText: { color: '#fff' },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.98 }] },
});
