import { api } from '@/lib/api';
import { Aravt, CreateAravt } from '@/types';
import { create } from 'zustand';

interface AravtsState {
  aravts: Aravt[];
  isLoading: boolean;
  error: string | null;
  aravtDetails: Aravt | null;
  fetchAravts: () => Promise<void>;
  fetchAravtDetails: (aravtId: number) => Promise<Aravt>;
  applyToAravt: (aravtId: number, text: string) => Promise<void>;
  createAravt: (aravt: CreateAravt) => Promise<void>;
}

export const useAravtsStore = create<AravtsState>((set) => ({
  aravts: [],
  isLoading: false,
  aravtDetails: null,
  error: null,
  fetchAravts: async () => {
    set({ isLoading: true, error: null });
    try {
      const Aravts: Aravt[] = await api.aravt();
      set({ aravts: Aravts, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch aravts', isLoading: false });
    }
  },
  fetchAravtDetails: async (aravtId: number) => {
    set({ isLoading: true, error: null });
    try {
      const aravtDetails: Aravt = await api.aravt_aravt(aravtId);
      set({ aravtDetails, isLoading: false });
      return aravtDetails;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch aravt details', isLoading: false });
      throw err;
    }
  },
  applyToAravt: async (aravtId: number, text: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.aravt_join(aravtId, text);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to apply to aravt', isLoading: false });
    }
  },
  createAravt: async (aravt: CreateAravt) => {
    set({ isLoading: true, error: null });
    try {
      await api.aravt_create_aravt(aravt);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create aravt', isLoading: false });
    }
  },
})); 