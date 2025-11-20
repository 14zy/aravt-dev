import { api } from '@/lib/api';
import { DISABLE_CACHE } from '@/lib/env';
import { dedupe, shouldRevalidate } from '@/lib/swrCache';
import { AravtDetails, AravtListItem, CreateAravt, UserAravtLink } from '@/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AravtsState {
  aravts: AravtListItem[];
  isLoading: boolean;
  error: string | null;
  aravtDetails: AravtDetails | null;
  aravtDetailsById: Record<number, AravtDetails>;
  fetchedAtById: Record<number, number>;
  currentAravtId?: number;
  fetchAravts: () => Promise<void>;
  fetchAravtDetails: (aravtId: number, opts?: { force?: boolean; ttlMs?: number }) => Promise<AravtDetails>;
  applyToAravt: (aravtId: number, text: string) => Promise<void>;
  createAravt: (aravt: CreateAravt) => Promise<AravtDetails>;
  setCurrentAravtId: (id: number | undefined) => void;
  getFirstAravtIdForUser: (userAravts?: UserAravtLink[]) => number | undefined;
}

export const useAravtsStore = create<AravtsState>()(persist((set, get) => ({
  aravts: [],
  isLoading: false,
  aravtDetails: null,
  aravtDetailsById: {},
  fetchedAtById: {},
  error: null,
  currentAravtId: undefined,
  fetchAravts: async () => {
    set({ isLoading: true, error: null });
    try {
      const Aravts: AravtListItem[] = await api.aravt();
      set({ aravts: Aravts, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch aravts', isLoading: false });
    }
  },
  fetchAravtDetails: async (aravtId: number, opts?: { force?: boolean; ttlMs?: number }) => {
    const { force, ttlMs } = opts || {};
    const cached = get().aravtDetailsById?.[aravtId];
    const fetchedAt = get().fetchedAtById?.[aravtId] ?? null;

    if (cached && !force && !DISABLE_CACHE) {
      // отдаём кеш мгновенно, в фоне обновляем при необходимости
      set({ aravtDetails: cached });
      if (shouldRevalidate(fetchedAt ?? null, ttlMs ?? 0)) {
        void dedupe(`aravt/${aravtId}`, async () => {
          try {
            const fresh = await api.aravt_aravt(aravtId);
            set((prev) => ({
              aravtDetails: fresh,
              aravtDetailsById: { ...(prev.aravtDetailsById || {}), [aravtId]: fresh },
              fetchedAtById: { ...(prev.fetchedAtById || {}), [aravtId]: Date.now() },
            }));
          } catch (e) {
            console.error('SWR refresh aravt details failed', e);
          }
        });
      }
      return cached;
    }
    set({ isLoading: true, error: null });
    try {
      const fresh: AravtDetails = await dedupe(`aravt/${aravtId}`, () => api.aravt_aravt(aravtId));
      set((prev) => ({
        aravtDetails: fresh,
        aravtDetailsById: { ...(prev.aravtDetailsById || {}), [aravtId]: fresh },
        fetchedAtById: { ...(prev.fetchedAtById || {}), [aravtId]: Date.now() },
        isLoading: false,
      }));
      return fresh;
    } catch (err) {
      console.error('fetchAravtDetails failed', err);
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
      const created = await api.aravt_create_aravt(aravt);
      set((prev) => ({
        isLoading: false,
        aravtDetails: created,
        aravtDetailsById: { ...(prev.aravtDetailsById || {}), [created.id]: created },
        fetchedAtById: { ...(prev.fetchedAtById || {}), [created.id]: Date.now() },
      }));
      void get().fetchAravts();
      return created;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create aravt', isLoading: false });
      throw err;
    }
  },
  setCurrentAravtId: (id) => set({ currentAravtId: id }),
  getFirstAravtIdForUser: (userAravts?: UserAravtLink[]) => {
    if (!userAravts || userAravts.length === 0) return undefined
    return userAravts[0]?.aravt?.id
  }
}), { name: 'aravts-selection' }));