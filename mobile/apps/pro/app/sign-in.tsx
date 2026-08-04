import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Brand } from '@/constants/theme';
import { toLatinDigits } from '@/lib/digits';
import { apiMessage } from '@/lib/format';
import { roleStorage } from '@/lib/session-storage';
import { ROLE_META, type ProRole } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

const ROLES = Object.keys(ROLE_META) as ProRole[];

export default function SignInScreen() {
  const { session, signIn } = useSession();
  const [role, setRole] = useState<ProRole>('GYM_OWNER');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    roleStorage.get().then((saved) => {
      if (saved && ROLES.includes(saved as ProRole)) setRole(saved as ProRole);
    });
  }, []);

  if (session) return <Redirect href="/(tabs)" />;

  async function submit() {
    if (!identifier.trim() || !password) {
      setError('شماره موبایل یا کد ملی و رمز عبور را وارد کنید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(toLatinDigits(identifier.trim()), password, role);
      router.replace('/(tabs)');
    } catch (reason) {
      setError(apiMessage(reason, 'اطلاعات ورود درست نیست یا حساب این نقش فعال نشده است.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[Brand.ink, '#113629', Brand.ink]} style={styles.background}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Ionicons name="shield-checkmark" size={32} color={Brand.ink} />
              </View>
              <Text style={styles.brandName}>گُردیار پرو</Text>
              <Text style={styles.tagline}>مرکز عملیات باشگاه، همیشه همراه شما</Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.heading}>
                <Text style={styles.title}>ورود همکاران گُردیار</Text>
                <Text style={styles.subtitle}>نقش خود را انتخاب و وارد پنل اختصاصی شوید.</Text>
              </View>

              <View style={styles.roles}>
                {ROLES.map((item) => {
                  const meta = ROLE_META[item];
                  const selected = role === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setRole(item)}
                      style={[styles.role, selected && styles.roleSelected]}>
                      <Ionicons
                        name={meta.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={selected ? Brand.ink : Brand.emerald}
                      />
                      <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                        {meta.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.selectedRole}>
                <Text style={styles.selectedRoleTitle}>{ROLE_META[role].label}</Text>
                <Text style={styles.selectedRoleDescription}>{ROLE_META[role].description}</Text>
              </View>

              <Field
                label="شماره موبایل یا کد ملی"
                icon="call-outline"
                keyboardType="number-pad"
                autoComplete="tel"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
              />
              <View>
                <Field
                  label="رمز عبور"
                  icon="lock-closed-outline"
                  secureTextEntry={hidden}
                  autoComplete="current-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="رمز عبور حساب پرسنلی"
                  onSubmitEditing={submit}
                />
                <Pressable onPress={() => setHidden((value) => !value)} style={styles.eye}>
                  <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={Brand.muted} />
                </Pressable>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title={`ورود به پنل ${ROLE_META[role].shortLabel}`} onPress={submit} loading={loading} />

              <View style={styles.security}>
                <Ionicons name="lock-closed" size={15} color={Brand.emerald} />
                <Text style={styles.securityText}>
                  حساب‌های پرسنلی فقط توسط مدیر باشگاه یا مدیریت گُردیار ساخته می‌شوند.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 18, gap: 22 },
  brand: { alignItems: 'center', gap: 7 },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: Brand.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { color: '#fff', fontSize: 27, fontWeight: '900' },
  tagline: { color: '#AEBDB5', fontSize: 12 },
  panel: { backgroundColor: '#F8FAF7', borderRadius: 27, padding: 18, gap: 15 },
  heading: { gap: 5 },
  title: { color: Brand.text, fontSize: 20, fontWeight: '900', textAlign: 'right' },
  subtitle: { color: Brand.muted, fontSize: 11, textAlign: 'right' },
  roles: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  role: {
    minWidth: '30%',
    flexGrow: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 13,
    backgroundColor: Brand.emeraldSoft,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  roleSelected: { backgroundColor: Brand.lime },
  roleText: { color: Brand.emerald, fontWeight: '900', fontSize: 11 },
  roleTextSelected: { color: Brand.ink },
  selectedRole: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBE5DB',
    backgroundColor: '#F1F8F5',
    padding: 11,
  },
  selectedRoleTitle: { color: Brand.emerald, fontWeight: '900', textAlign: 'right' },
  selectedRoleDescription: { color: Brand.muted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  eye: { position: 'absolute', left: 15, bottom: 15, padding: 4 },
  error: {
    color: Brand.danger,
    backgroundColor: Brand.dangerSoft,
    padding: 10,
    borderRadius: 12,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
  },
  security: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 6 },
  securityText: { color: Brand.muted, fontSize: 9, textAlign: 'right' },
});
