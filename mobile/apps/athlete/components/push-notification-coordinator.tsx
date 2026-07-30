import type { Href } from 'expo-router';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { api } from '@/lib/api';
import { registerForPushNotifications } from '@/lib/push-notifications';
import { useSession } from '@/providers/session-provider';

const allowedRoutes = new Set([
  '/notifications',
  '/insurance',
  '/parental-consent',
]);

export function PushNotificationCoordinator() {
  const { session } = useSession();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (!session) return;
    registerForPushNotifications().catch(() => undefined);
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier;
      if (handledResponseId.current === identifier) return;
      handledResponseId.current = identifier;

      const data = response.notification.request.content.data;
      const notificationId =
        typeof data.notificationId === 'string'
          ? data.notificationId
          : null;
      if (notificationId) {
        api.markNotificationRead(notificationId).catch(() => undefined);
      }

      const requestedRoute =
        typeof data.route === 'string' ? data.route : '/notifications';
      const route = allowedRoutes.has(requestedRoute)
        ? requestedRoute
        : '/notifications';
      router.push(route as Href);
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch(() => undefined);

    return () => subscription.remove();
  }, [session]);

  return null;
}
