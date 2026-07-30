import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Brand } from '@/constants/theme';
import { SessionProvider } from '@/providers/session-provider';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Brand.surface },
          headerTintColor: Brand.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: Brand.surface },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: 'ورود ورزشکار', presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ title: 'ساخت حساب ورزشکار' }} />
        <Stack.Screen name="gyms/[slug]" options={{ title: 'معرفی باشگاه' }} />
        <Stack.Screen name="progress" options={{ title: 'روند پیشرفت من' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'ویرایش پروفایل' }} />
        <Stack.Screen name="payments" options={{ title: 'پرداخت‌ها و رسیدها' }} />
        <Stack.Screen name="insurance" options={{ title: 'بیمه ورزشی' }} />
        <Stack.Screen name="notifications" options={{ title: 'اعلان‌ها' }} />
      </Stack>
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
