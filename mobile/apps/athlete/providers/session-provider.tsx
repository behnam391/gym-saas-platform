import type { SessionTokens } from '@gordyar/mobile-core';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { sessionStorage } from '@/lib/session-storage';

type SessionContextValue = {
  session: SessionTokens | null;
  isLoading: boolean;
  signIn(identifier: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refreshFromStorage(): Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFromStorage = useCallback(async () => {
    setSession(await sessionStorage.load());
  }, []);

  useEffect(() => {
    refreshFromStorage().finally(() => setIsLoading(false));
  }, [refreshFromStorage]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isLoading,
      async signIn(identifier, password) {
        const next = await api.login({ identifier, password });
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
      refreshFromStorage,
    }),
    [isLoading, refreshFromStorage, session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
