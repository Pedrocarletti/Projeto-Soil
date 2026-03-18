import type {
  FarmRecord,
  LoginResponse,
  Pivot,
  PivotState,
  User,
  WeatherResponse,
} from '@/types/domain';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '@/lib/session';

const LOCAL_API_URL = 'http://localhost:33001/api';
const LOCAL_WS_URL = 'http://localhost:33001/realtime';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'development' ? LOCAL_API_URL : '');
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  (process.env.NODE_ENV === 'development' ? LOCAL_WS_URL : '');

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function getWsUrl() {
  return WS_URL || null;
}

let refreshPromise: Promise<string | null> | null = null;

function getApiUrl() {
  if (API_URL) {
    return API_URL;
  }

  throw new ApiError(
    'NEXT_PUBLIC_API_URL nao configurada para este deploy.',
    500,
  );
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message ?? 'Erro inesperado na API.';
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

async function refreshSessionRequest(refreshToken: string) {
  const response = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) {
    clearStoredSession();
    return null;
  }

  const payload = (await response.json()) as LoginResponse;
  writeStoredSession({
    token: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  });

  return payload.accessToken;
}

async function refreshAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!refreshPromise) {
    const session = readStoredSession();

    if (!session?.refreshToken) {
      return null;
    }

    refreshPromise = refreshSessionRequest(session.refreshToken).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${getApiUrl()}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401 && token) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken && refreshedToken !== token) {
      const retryHeaders = new Headers(options.headers);

      if (!retryHeaders.has('Content-Type') && options.body) {
        retryHeaders.set('Content-Type', 'application/json');
      }

      retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);

      const retryResponse = await fetch(url, {
        ...options,
        headers: retryHeaders,
        cache: 'no-store',
      });

      return parseResponse<T>(retryResponse);
    }
  }

  return parseResponse<T>(response);
}

export async function loginRequest(email: string, password: string) {
  return apiFetch<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    null,
  );
}

export async function getProfile(token: string) {
  return apiFetch<User>('/auth/me', {}, token);
}

export async function getFarms(token: string) {
  return apiFetch<FarmRecord[]>('/farms', {}, token);
}

export async function createFarm(
  token: string,
  payload: {
    name: string;
    latitude: number;
    longitude: number;
  },
) {
  return apiFetch<FarmRecord>(
    '/farms',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateFarm(
  id: string,
  token: string,
  payload: {
    name: string;
    latitude: number;
    longitude: number;
  },
) {
  return apiFetch<FarmRecord>(
    `/farms/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteFarm(id: string, token: string) {
  return apiFetch<{ deleted: boolean }>(
    `/farms/${id}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export async function createPivot(
  token: string,
  payload: {
    farmId: string;
    name: string;
    code: string;
    latitude: number;
    longitude: number;
    bladeAt100: number;
  },
) {
  return apiFetch<Pivot>(
    '/pivots',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getPivots(token: string) {
  return apiFetch<Pivot[]>('/pivots', {}, token);
}

export async function getPivot(id: string, token: string) {
  return apiFetch<Pivot>(`/pivots/${id}`, {}, token);
}

export async function getPivotHistory(id: string, token: string) {
  return apiFetch<PivotState[]>(`/pivots/${id}/history`, {}, token);
}

export async function getPivotHistoryFiltered(
  id: string,
  token: string,
  filters: {
    startAt?: string;
    endAt?: string;
    isOn?: boolean;
    isIrrigating?: boolean;
    limit?: number;
  } = {},
) {
  const params = new URLSearchParams();

  if (filters.startAt) {
    params.set('startAt', filters.startAt);
  }

  if (filters.endAt) {
    params.set('endAt', filters.endAt);
  }

  if (typeof filters.isOn === 'boolean') {
    params.set('isOn', String(filters.isOn));
  }

  if (typeof filters.isIrrigating === 'boolean') {
    params.set('isIrrigating', String(filters.isIrrigating));
  }

  if (typeof filters.limit === 'number') {
    params.set('limit', String(filters.limit));
  }

  const search = params.toString();
  const path = search
    ? `/pivots/${id}/history?${search}`
    : `/pivots/${id}/history`;

  return apiFetch<PivotState[]>(path, {}, token);
}

export async function controlPivot(
  id: string,
  token: string,
  payload: {
    isOn: boolean;
    direction: 'clockwise' | 'counter-clockwise' | 'stopped';
    irrigationMode: 'water' | 'movement';
    percentimeter?: number;
  },
) {
  return apiFetch<{ acknowledged: boolean }>(
    `/pivots/${id}/control`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getWeather(
  latitude: number,
  longitude: number,
  token: string,
) {
  return apiFetch<WeatherResponse>(
    `/weather?latitude=${latitude}&longitude=${longitude}`,
    {},
    token,
  );
}
