import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as api from '@/lib/api';
import type { AuthUser } from '@/lib/api';

const TOKEN_KEY = 'auth_token';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: Status;
  /** Restore any persisted session on app start. */
  hydrate: () => Promise<void>;
  /** Register + trigger a verification email. Does NOT sign in (hard gate). */
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** Confirm an emailed code → marks verified and signs in. */
  verifyEmail: (email: string, code: string) => Promise<void>;
  /** (Re)send a verification code. */
  resendVerification: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  status: 'loading',

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return set({ status: 'signedOut' });
    try {
      const { user } = await api.getMe(token);
      set({ token, user, status: 'signedIn' });
    } catch {
      // token invalid/expired or server unreachable → treat as signed out
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({ token: null, user: null, status: 'signedOut' });
    }
  },

  signUp: async (email, password) => {
    // Hard gate: this creates the account and emails a code, but returns no
    // session. The user becomes signed in only after verifyEmail() succeeds.
    await api.signup(email, password);
  },

  signIn: async (email, password) => {
    // Throws VerificationRequiredError for unverified accounts — the caller
    // routes to the verify screen.
    const { token, user } = await api.login(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user, status: 'signedIn' });
  },

  verifyEmail: async (email, code) => {
    const { token, user } = await api.confirmVerification(email, code);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user, status: 'signedIn' });
  },

  resendVerification: async (email) => {
    await api.requestVerification(email);
  },

  signOut: async () => {
    const { token } = get();
    if (token) await api.logout(token).catch(() => {}); // best-effort server revoke
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null, status: 'signedOut' });
  },
}));
