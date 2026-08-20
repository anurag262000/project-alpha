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

/**
 * Thrown when the backend refuses because the account's email isn't verified
 * yet (signup, or login of an unverified account). Carries the email so the UI
 * can route to the verification screen and (re)request a code.
 */
export class VerificationRequiredError extends ApiError {
  email: string;
  constructor(message: string, status: number, email: string) {
    super(message, status);
    this.email = email;
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
  if (!res.ok) {
    if (body.verificationRequired) {
      throw new VerificationRequiredError(body.error ?? 'Please verify your email.', res.status, body.email);
    }
    throw new ApiError(body.error ?? 'Something went wrong.', res.status);
  }
  return body as T;
}

/** Hard gate: signup no longer returns a session — it emails a code first. */
export function signup(email: string, password: string) {
  return request<{ verificationRequired: true; email: string }>('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

/** (Re)send a verification code to the email. Always resolves (never leaks existence). */
export function requestVerification(email: string) {
  return request<{ ok: true }>('/verify/request', { method: 'POST', body: JSON.stringify({ email }) });
}

/** Confirm the code → marks the email verified and returns the first session. */
export function confirmVerification(email: string, code: string) {
  return request<AuthResponse>('/verify/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function logout(token: string) {
  return request<{ ok: true }>('/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

export function getMe(token: string) {
  return request<{ user: AuthUser }>('/me', { headers: { Authorization: `Bearer ${token}` } });
}
