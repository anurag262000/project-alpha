/**
 * Thin fetch client for backend/auth-worker.
 * Base URL: EXPO_PUBLIC_* vars are inlined at build time by Expo SDK 52+.
 * Falls back to wrangler dev's default local port for development.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? 'Something went wrong.', res.status);
  return body as T;
}

export function signup(email: string, password: string) {
  return request<AuthResponse>('/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout(token: string) {
  return request<{ ok: true }>('/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

export function getMe(token: string) {
  return request<{ user: AuthUser }>('/me', { headers: { Authorization: `Bearer ${token}` } });
}
