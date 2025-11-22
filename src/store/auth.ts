import { api } from '@/lib/api';
import { DISABLE_CACHE } from '@/lib/env';
import { dedupe, shouldRevalidate } from '@/lib/swrCache';
import { User } from '@/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  referralInfo: {
    aravtId?: number;
    referredById?: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  profileFetchedAt: number | null;
  fetchUser: (opts?: { force?: boolean; ttlMs?: number }) => Promise<void>;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setReferralInfo: (data: { aravtId?: number; referredById?: number } | null) => void;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      referralInfo: null,
      isLoading: false,
      error: null,
      profileFetchedAt: null,
      fetchUser: async (opts) => {
        const cachedUser = get().user;
        if (!cachedUser) {
          console.warn('fetchUser skipped: no cached user in store');
          return;
        }

        const ttl = opts?.ttlMs ?? 0;
        const shouldRefresh = shouldRevalidate(get().profileFetchedAt, ttl);

        if (cachedUser && !opts?.force && !DISABLE_CACHE && !shouldRefresh) {
          return;
        }

        const runFetch = async () => {
          const freshUser = await api.users_user(cachedUser.id);
          set({
            user: freshUser,
            isAuthenticated: true,
            profileFetchedAt: Date.now(),
          });
          return freshUser;
        };

        if (cachedUser && !opts?.force && !DISABLE_CACHE && get().profileFetchedAt) {
          void dedupe('auth/user', runFetch).catch((error) => {
            console.error('SWR refresh auth/user failed', error);
          });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await dedupe('auth/user', runFetch);
          set({ isLoading: false });
        } catch (error) {
          console.error('fetchUser failed', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch user',
            isLoading: false,
          });
        }
      },
      setToken: (token: string) => set({ token, isAuthenticated: true }),
      login: (user: User, token: string) => 
        set({
          user,
          token,
          isAuthenticated: true,
          profileFetchedAt: Date.now(),
          isLoading: false,
          error: null,
        }),
      logout: () => 
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          referralInfo: null,
          profileFetchedAt: null,
          isLoading: false,
          error: null,
        }),
      setReferralInfo: (data) => set({ referralInfo: data }),
      connectWallet: async (address: string) => {
        const { user } = get();
        if (user) {
          try {
            const updated_user = await api.link_wallet(user.id, address);
            set({ user: updated_user });
          } catch (error) {
            console.error('Failed to link wallet:', error);
            throw error;
          }
        }
      },
      disconnectWallet: () => {
        const { user } = get();
        if (user) {
          set({ 
            user: { 
              ...user, 
              wallet_address: null
            } 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
) 