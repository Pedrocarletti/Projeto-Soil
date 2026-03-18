'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiError, getProfile, loginRequest } from '@/lib/api';
import {
  clearStoredSession,
  readStoredSession,
  SESSION_UPDATED_EVENT,
  type StoredSession,
  writeStoredSession,
} from '@/lib/session';
import type { User } from '@/types/domain';

interface AuthContextValue {
  isReady: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function syncSessionFromStorage() {
      setSession(readStoredSession());
    }

    window.addEventListener(SESSION_UPDATED_EVENT, syncSessionFromStorage);
    window.addEventListener('storage', syncSessionFromStorage);

    return () => {
      window.removeEventListener(SESSION_UPDATED_EVENT, syncSessionFromStorage);
      window.removeEventListener('storage', syncSessionFromStorage);
    };
  }, []);

  useEffect(() => {
    async function hydrate() {
      const parsedSession = readStoredSession();

      if (!parsedSession) {
        setIsReady(true);
        return;
      }

      try {
        setSession(parsedSession);
        setIsReady(true);

        const profile = await getProfile(parsedSession.token);
        const latestSession = readStoredSession() ?? parsedSession;
        const nextSession = {
          token: latestSession.token,
          refreshToken: latestSession.refreshToken,
          user: profile,
        };

        writeStoredSession(nextSession);
        setSession(nextSession);
      } catch (error) {
        const isApiAuthError =
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403);

        if (!(error instanceof ApiError) || isApiAuthError) {
          clearStoredSession();
          setSession(null);
        }

        setIsReady(true);
      }
    }

    void hydrate();
  }, []);

  async function login(email: string, password: string) {
    const response = await loginRequest(email, password);
    const nextSession = {
      token: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    };

    writeStoredSession(nextSession);
    setSession(nextSession);
  }

  function logout() {
    clearStoredSession();
    setSession(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      token: session?.token ?? null,
      user: session?.user ?? null,
      login,
      logout,
    }),
    [isReady, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
