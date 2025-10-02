import { api } from '@/lib/api';
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
  fetchUser: () => Promise<void>;
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
      fetchUser: async () => {
        const st_user = get().user;
        if (st_user) {
          const new_user = await api.users_user(st_user.id);
          set({ user: new_user, isAuthenticated: true })
        }
      },
      setToken: (token: string) => set({ token, isAuthenticated: true }),
      login: (user: User, token: string) => 
        set({ user, token, isAuthenticated: true }),
      logout: () => 
        set({ user: null, token: null, isAuthenticated: false, referralInfo: null }),
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