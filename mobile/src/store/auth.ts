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
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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
    const { token, user } = await api.signup(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user, status: 'signedIn' });
  },

  signIn: async (email, password) => {
    const { token, user } = await api.login(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user, status: 'signedIn' });
  },

  signOut: async () => {
    const { token } = get();
    if (token) await api.logout(token).catch(() => {}); // best-effort server revoke
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null, status: 'signedOut' });
  },
}));
