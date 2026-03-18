'use client';

import type { User } from '@/types/domain';

export const SESSION_STORAGE_KEY = 'soil.session';
export const SESSION_UPDATED_EVENT = 'soil:session-updated';

export interface StoredSession {
  token: string;
  refreshToken: string;
  user: User;
}

export function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as StoredSession;

    if (
      typeof parsedSession?.token !== 'string' ||
      typeof parsedSession?.refreshToken !== 'string' ||
      !parsedSession.user
    ) {
      return null;
    }

    return parsedSession;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}
