import { GordyarApiClient } from '@gordyar/mobile-core';
import { sessionStorage } from './session-storage';

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'https://app-api.gordyar.ir/api/v1';

export const api = new GordyarApiClient(apiBaseUrl, sessionStorage);
