import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api } from '@/lib/api';

const PUSH_TOKEN_KEY = 'gordyar.expo-push-token';
const ANDROID_CHANNEL_ID = 'gordyar-updates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getPushCapabilityStatus() {
  if (
    Platform.OS === 'web' ||
    !Device.isDevice ||
    Constants.appOwnership === 'expo'
  ) {
    return 'unavailable' as const;
  }
  const permission = await Notifications.getPermissionsAsync();
  return permission.status === 'granted'
    ? ('enabled' as const)
    : ('disabled' as const);
}

export async function registerForPushNotifications(
  requestPermission = false,
) {
  if ((await getPushCapabilityStatus()) === 'unavailable') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'اعلان‌های مهم گُردیار',
      description: 'نتیجه مدارک، پرداخت‌ها و پیام‌های مهم حساب',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 180, 250],
      lightColor: '#16865E',
      sound: 'default',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission =
    existing.status === 'granted'
      ? existing
      : requestPermission
        ? await Notifications.requestPermissionsAsync()
        : existing;
  if (permission.status !== 'granted') {
    await deactivateStoredPushToken();
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) return null;

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;
  await api.registerPushDevice({
    expoPushToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    deviceName: Device.modelName ?? undefined,
  });
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, expoPushToken);
  return expoPushToken;
}

export function getStoredPushToken() {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export function clearStoredPushToken() {
  return SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

async function deactivateStoredPushToken() {
  const token = await getStoredPushToken();
  if (!token) return;
  try {
    await api.unregisterPushDevice(token);
  } finally {
    await clearStoredPushToken();
  }
}
