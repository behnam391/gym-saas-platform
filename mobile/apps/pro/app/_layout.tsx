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
          headerStyle: { backgroundColor: Brand.card },
          headerTintColor: Brand.text,
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: '900' },
          contentStyle: { backgroundColor: Brand.surface },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="members" options={{ title: 'اعضای باشگاه' }} />
        <Stack.Screen name="attendance" options={{ title: 'ورود و خروج' }} />
        <Stack.Screen name="staff" options={{ title: 'پرسنل باشگاه' }} />
        <Stack.Screen name="cafeteria" options={{ title: 'مدیریت بوفه' }} />
        <Stack.Screen name="professional" options={{ title: 'خدمات تخصصی' }} />
        <Stack.Screen name="notifications" options={{ title: 'اعلان‌ها' }} />
        <Stack.Screen name="support" options={{ title: 'پشتیبانی' }} />
        <Stack.Screen name="conversation/[id]" options={{ title: 'گفت‌وگو' }} />
        <Stack.Screen name="change-password" options={{ title: 'تغییر رمز عبور' }} />
      </Stack>
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
