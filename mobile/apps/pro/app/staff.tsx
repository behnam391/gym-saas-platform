import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { EmptyState, LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { toLatinDigits } from '@/lib/digits';
import { apiMessage } from '@/lib/format';
import { ROLE_META, type Staff, type StaffRole } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

const ROLES: StaffRole[] = ['RECEPTION', 'BUFFET_STAFF', 'TRAINER', 'NUTRITIONIST'];
const EMPTY = {
  role: 'RECEPTION' as StaffRole,
  firstName: '',
  lastName: '',
  nationalId: '',
  mobile: '',
  email: '',
  gender: 'MALE' as 'MALE' | 'FEMALE',
  dateOfBirth: '1995-01-01',
  specialties: '',
  bio: '',
};

export default function StaffScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<Staff[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [credential, setCredential] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const allowed = session?.role === 'GYM_OWNER';

  const load = useCallback(async () => {
    try {
      setItems(await api.get<Staff[]>('/tenant-staff'));
    } catch (reason) {
      Alert.alert('خطا', apiMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) return <Redirect href="/(tabs)" />;
  if (loading) return <LoadingState label="در حال دریافت فهرست پرسنل…" />;

  async function create() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.mobile || !form.nationalId) {
      Alert.alert('اطلاعات ناقص', 'نام، نام خانوادگی، کد ملی و موبایل الزامی است.');
      return;
    }
    setBusy(true);
    try {
      const created = await api.post<Staff>('/tenant-staff', {
        ...form,
        nationalId: toLatinDigits(form.nationalId),
        mobile: toLatinDigits(form.mobile),
        email: form.email.trim() || undefined,
        specialties: form.specialties
          .split(/[،,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        bio: form.bio.trim() || undefined,
      });
      setCredential(created);
      setItems((current) => [created, ...current]);
      setForm(EMPTY);
      setShowForm(false);
    } catch (reason) {
      Alert.alert('حساب ساخته نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Staff) {
    setBusy(true);
    try {
      const updated = await api.patch<Staff>(`/tenant-staff/${item.id}/access`, {
        isActive: !item.isActive,
      });
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (reason) {
      Alert.alert('تغییر دسترسی انجام نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen onRefresh={load}>
      <Button
        title={showForm ? 'بستن فرم ساخت حساب' : 'ساخت حساب همکار جدید'}
        icon={showForm ? 'close' : 'person-add'}
        variant={showForm ? 'secondary' : 'primary'}
        onPress={() => setShowForm((value) => !value)}
      />

      {credential?.temporaryPassword ? (
        <Card style={styles.credential}>
          <View style={styles.credentialHead}>
            <Ionicons name="checkmark-circle" size={25} color={Brand.emerald} />
            <Text style={styles.credentialTitle}>حساب با موفقیت ساخته شد</Text>
          </View>
          <Text style={styles.credentialHint}>
            این رمز فقط همین یک‌بار نمایش داده می‌شود؛ آن را امن برای همکار ارسال کنید.
          </Text>
          <View style={styles.credentialGrid}>
            <View style={styles.credentialItem}>
              <Text style={styles.credentialLabel}>نام کاربری</Text>
              <Text selectable style={styles.credentialValue}>{credential.mobile}</Text>
            </View>
            <View style={styles.credentialItem}>
              <Text style={styles.credentialLabel}>رمز موقت</Text>
              <Text selectable style={styles.credentialValue}>{credential.temporaryPassword}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {showForm ? (
        <Card style={styles.form}>
          <Text style={styles.formTitle}>مشخصات همکار جدید</Text>
          <Text style={styles.label}>نقش سازمانی</Text>
          <View style={styles.chips}>
            {ROLES.map((role) => (
              <Pressable
                key={role}
                onPress={() => setForm((value) => ({ ...value, role }))}
                style={[styles.chip, form.role === role && styles.chipSelected]}>
                <Text style={[styles.chipText, form.role === role && styles.chipTextSelected]}>
                  {ROLE_META[role].shortLabel}
                </Text>
              </Pressable>
            ))}
          </View>
          <Field label="نام" value={form.firstName} onChangeText={(firstName) => setForm({ ...form, firstName })} />
          <Field label="نام خانوادگی" value={form.lastName} onChangeText={(lastName) => setForm({ ...form, lastName })} />
          <Field
            label="کد ملی"
            keyboardType="number-pad"
            maxLength={10}
            value={form.nationalId}
            onChangeText={(nationalId) => setForm({ ...form, nationalId })}
          />
          <Field
            label="شماره موبایل"
            keyboardType="phone-pad"
            maxLength={11}
            value={form.mobile}
            onChangeText={(mobile) => setForm({ ...form, mobile })}
          />
          <Field
            label="ایمیل (اختیاری)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(email) => setForm({ ...form, email })}
          />
          <Field
            label="تاریخ تولد میلادی"
            value={form.dateOfBirth}
            onChangeText={(dateOfBirth) => setForm({ ...form, dateOfBirth })}
            placeholder="1995-01-01"
          />
          <Text style={styles.label}>جنسیت</Text>
          <View style={styles.chips}>
            {(['MALE', 'FEMALE'] as const).map((gender) => (
              <Pressable
                key={gender}
                onPress={() => setForm({ ...form, gender })}
                style={[styles.chip, form.gender === gender && styles.chipSelected]}>
                <Text style={[styles.chipText, form.gender === gender && styles.chipTextSelected]}>
                  {gender === 'MALE' ? 'مرد' : 'زن'}
                </Text>
              </Pressable>
            ))}
          </View>
          {['TRAINER', 'NUTRITIONIST'].includes(form.role) ? (
            <>
              <Field
                label="تخصص‌ها"
                value={form.specialties}
                onChangeText={(specialties) => setForm({ ...form, specialties })}
                placeholder="بدنسازی، کاهش وزن، فیتنس"
              />
              <Field
                label="معرفی کوتاه"
                multiline
                value={form.bio}
                onChangeText={(bio) => setForm({ ...form, bio })}
              />
            </>
          ) : null}
          <Button title="ساخت حساب و رمز موقت" onPress={create} loading={busy} />
        </Card>
      ) : null}

      <View style={styles.listHeader}>
        <Badge tone="info">{items.length.toLocaleString('fa-IR')} نفر</Badge>
        <Text style={styles.listTitle}>همکاران باشگاه</Text>
      </View>

      {items.length ? (
        items.map((item) => (
          <Card key={item.id} style={styles.item}>
            <View style={styles.itemHead}>
              <Badge tone={item.isActive ? 'success' : 'danger'}>
                {item.isActive ? 'فعال' : 'غیرفعال'}
              </Badge>
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.itemMeta}>{ROLE_META[item.role].label} · {item.mobile}</Text>
              </View>
              <View style={styles.avatar}>
                <Ionicons name={ROLE_META[item.role].icon as keyof typeof Ionicons.glyphMap} size={21} color={Brand.emerald} />
              </View>
            </View>
            {item.trainerProfile?.specialties?.length ? (
              <Text style={styles.specialties}>{item.trainerProfile.specialties.join('، ')}</Text>
            ) : null}
            <Button
              compact
              title={item.isActive ? 'قطع دسترسی' : 'فعال‌سازی دسترسی'}
              variant={item.isActive ? 'danger' : 'secondary'}
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  item.isActive ? 'قطع دسترسی' : 'فعال‌سازی',
                  `دسترسی ${item.firstName} ${item.lastName} تغییر کند؟`,
                  [
                    { text: 'انصراف', style: 'cancel' },
                    { text: 'تأیید', onPress: () => toggle(item) },
                  ],
                )
              }
            />
          </Card>
        ))
      ) : (
        <Card>
          <EmptyState title="هنوز حساب پرسنلی ساخته نشده است" />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  credential: { gap: 11, borderColor: '#B9DECF', backgroundColor: '#F3FAF7' },
  credentialHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  credentialTitle: { color: Brand.emerald, fontWeight: '900', fontSize: 14 },
  credentialHint: { color: Brand.muted, fontSize: 10, lineHeight: 17, textAlign: 'right' },
  credentialGrid: { flexDirection: 'row-reverse', gap: 8 },
  credentialItem: { flex: 1, borderRadius: 12, backgroundColor: Brand.card, padding: 10 },
  credentialLabel: { color: Brand.muted, fontSize: 9, textAlign: 'right' },
  credentialValue: { color: Brand.text, fontSize: 12, fontWeight: '900', marginTop: 5, textAlign: 'right' },
  form: { gap: 12 },
  formTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  label: { color: Brand.text, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: Brand.surface, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9 },
  chipSelected: { backgroundColor: Brand.lime },
  chipText: { color: Brand.muted, fontSize: 10, fontWeight: '800' },
  chipTextSelected: { color: Brand.ink },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { color: Brand.text, fontSize: 16, fontWeight: '900' },
  item: { gap: 11 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemBody: { flex: 1, alignItems: 'flex-end' },
  itemName: { color: Brand.text, fontWeight: '900', fontSize: 13 },
  itemMeta: { color: Brand.muted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  avatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: Brand.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  specialties: { color: Brand.muted, fontSize: 10, textAlign: 'right' },
});
