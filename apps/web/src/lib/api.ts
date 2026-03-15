import type {
  LoginResponse,
  Pivot,
  PivotState,
  User,
  WeatherResponse,
} from '@/types/domain';

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

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

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

export async function getPivots(token: string) {
  return apiFetch<Pivot[]>('/pivots', {}, token);
}

export async function getPivot(id: string, token: string) {
  return apiFetch<Pivot>(`/pivots/${id}`, {}, token);
}

export async function getPivotHistory(id: string, token: string) {
  return apiFetch<PivotState[]>(`/pivots/${id}/history`, {}, token);
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
