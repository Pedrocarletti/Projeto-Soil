'use client';

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiError, getProfile, loginRequest } from '@/lib/api';
import type { User } from '@/types/domain';

const STORAGE_KEY = 'soil.session';

interface SessionState {
  token: string;
  user: User;
}

interface AuthContextValue {
  isReady: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const rawSession = window.localStorage.getItem(STORAGE_KEY);

      if (!rawSession) {
        setIsReady(true);
        return;
      }

      try {
        const parsedSession = JSON.parse(rawSession) as SessionState;

        if (
          typeof parsedSession?.token !== 'string' ||
          !parsedSession.user
        ) {
          throw new Error('Sessao invalida.');
        }

        startTransition(() => {
          setSession(parsedSession);
        });
        setIsReady(true);

        const profile = await getProfile(parsedSession.token);
        const nextSession = {
          token: parsedSession.token,
          user: profile,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        startTransition(() => {
          setSession(nextSession);
        });
      } catch (error) {
        const isApiAuthError =
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403);

        if (!(error instanceof ApiError) || isApiAuthError) {
          window.localStorage.removeItem(STORAGE_KEY);
          startTransition(() => {
            setSession(null);
          });
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
      user: response.user,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    startTransition(() => {
      setSession(nextSession);
    });
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
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
