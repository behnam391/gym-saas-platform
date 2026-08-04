import type { SessionStore, SessionTokens } from '@gordyar/mobile-core';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'gordyar.pro.session.v1';
const ROLE_KEY = 'gordyar.pro.last-role.v1';

export const sessionStorage: SessionStore = {
  async load() {
    const value = await SecureStore.getItemAsync(SESSION_KEY);
    if (!value) return null;
    try {
      return JSON.parse(value) as SessionTokens;
    } catch {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
  },
  save(tokens) {
    return SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(tokens), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  clear() {
    return SecureStore.deleteItemAsync(SESSION_KEY);
  },
};

export const roleStorage = {
  get: () => SecureStore.getItemAsync(ROLE_KEY),
  set: (role: string) => SecureStore.setItemAsync(ROLE_KEY, role),
};
