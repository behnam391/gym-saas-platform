import type { BasicUserProfile } from '@gordyar/mobile-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen, Surface } from '@/components/screen';
import { SectionTitle } from '@/components/section-title';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/providers/session-provider';

export default function EditProfileScreen() {
  const { session, isLoading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<BasicUserProfile | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    city: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const next = await api.getMyBasicProfile();
      setProfile(next);
      setForm({
        firstName: next.firstName,
        lastName: next.lastName,
        city: next.city ?? '',
        address: next.address ?? '',
      });
    } catch {
      setError('اطلاعات پروفایل دریافت نشد.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/sign-in');
      return;
    }
    loadProfile();
  }, [loadProfile, session, sessionLoading]);

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'دسترسی به تصاویر',
        'برای انتخاب عکس پروفایل، اجازه دسترسی به گالری را فعال کنید.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) {
      Alert.alert('حجم زیاد', 'حجم عکس باید کمتر از ۸ مگابایت باشد.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const uploaded = await api.uploadProfileImage({
        uri: asset.uri,
        name: asset.fileName ?? `profile-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      const updated = await api.updateMyBasicProfile({
        profileImageUrl: uploaded.url,
      });
      setProfile(updated);
      Alert.alert('عکس ذخیره شد', 'تصویر پروفایل با موفقیت تغییر کرد.');
    } catch {
      setError('آپلود عکس انجام نشد. اتصال اینترنت و نوع فایل را بررسی کنید.');
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert('اطلاعات ناقص', 'نام و نام خانوادگی را وارد کنید.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateMyBasicProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
      });
      setProfile(updated);
      Alert.alert('ذخیره شد', 'اطلاعات پروفایل با موفقیت به‌روزرسانی شد.');
    } catch {
      setError('ذخیره اطلاعات انجام نشد. دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || (loading && !profile)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.emerald} />
        <Text style={styles.loadingText}>در حال دریافت پروفایل…</Text>
      </View>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={loadProfile}>
      <SectionTitle
        title="ویرایش پروفایل"
        hint="اطلاعاتی که در حساب ورزشی شما نمایش داده می‌شود"
      />

      <Surface style={styles.photoCard}>
        <View style={styles.avatar}>
          {profile?.profileImageUrl ? (
            <Image
              source={{ uri: profile.profileImageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={180}
            />
          ) : (
            <Ionicons name="person" size={46} color={Brand.emerald} />
          )}
          {uploading ? (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <View style={styles.photoCopy}>
          <Text style={styles.photoTitle}>عکس پروفایل</Text>
          <Text style={styles.photoHint}>تصویر مربعی JPG، PNG یا WebP تا ۸ مگابایت</Text>
          <Pressable
            disabled={uploading}
            onPress={chooseImage}
            style={styles.photoButton}>
            <Ionicons name="camera-outline" size={17} color={Brand.ink} />
            <Text style={styles.photoButtonText}>
              {uploading ? 'در حال آپلود…' : 'انتخاب عکس'}
            </Text>
          </Pressable>
        </View>
      </Surface>

      <Surface style={styles.formCard}>
        <FormField
          label="نام"
          icon="person-outline"
          value={form.firstName}
          onChangeText={(value) => setForm((item) => ({ ...item, firstName: value }))}
        />
        <FormField
          label="نام خانوادگی"
          icon="person-outline"
          value={form.lastName}
          onChangeText={(value) => setForm((item) => ({ ...item, lastName: value }))}
        />
        <FormField
          label="شماره موبایل"
          icon="call-outline"
          value={profile?.mobile ?? ''}
          editable={false}
        />
        <FormField
          label="شهر"
          icon="location-outline"
          value={form.city}
          onChangeText={(value) => setForm((item) => ({ ...item, city: value }))}
        />
        <FormField
          label="آدرس"
          icon="map-outline"
          value={form.address}
          multiline
          onChangeText={(value) => setForm((item) => ({ ...item, address: value }))}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton
          title="ذخیره تغییرات"
          onPress={saveProfile}
          loading={saving}
          disabled={uploading}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Brand.surface,
  },
  loadingText: { color: Brand.muted, fontSize: 12 },
  photoCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 15 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F4EC',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,17,14,0.62)',
  },
  photoCopy: { flex: 1, alignItems: 'flex-end', gap: 7 },
  photoTitle: { color: Brand.text, fontSize: 16, fontWeight: '900' },
  photoHint: { color: Brand.muted, fontSize: 10, lineHeight: 17, textAlign: 'right' },
  photoButton: {
    minHeight: 39,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.lime,
  },
  photoButtonText: { color: Brand.ink, fontSize: 11, fontWeight: '900' },
  formCard: { gap: 15 },
  errorText: { color: Brand.danger, fontSize: 12, textAlign: 'right' },
});
