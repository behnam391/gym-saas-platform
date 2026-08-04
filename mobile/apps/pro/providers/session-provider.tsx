import type { SessionTokens } from '@gordyar/mobile-core';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from '@/lib/api';
import { roleStorage, sessionStorage } from '@/lib/session-storage';
import type { ProRole } from '@/lib/types';

type SessionContextValue = {
  session: SessionTokens | null;
  isLoading: boolean;
  signIn(identifier: string, password: string, role: ProRole): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSession(await sessionStorage.load());
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isLoading,
      async signIn(identifier, password, role) {
        const next = await api.loginAs({ identifier, password, expectedRole: role });
        await roleStorage.set(role);
        setSession(next);
      },
      async signOut() {
        try {
          await api.logout();
        } finally {
          await sessionStorage.clear();
          setSession(null);
        }
      },
      refresh,
    }),
    [isLoading, refresh, session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
