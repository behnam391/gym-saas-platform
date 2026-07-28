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
      </Stack>
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
