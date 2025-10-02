import { api } from '@/lib/api';
import { CreateOffer, Offer } from '@/types';
import { create } from 'zustand';

interface OffersState {
  offers: Offer[];
  isLoading: boolean;
  error: string | null;
  fetchOffers: () => Promise<void>;
  createOffer: (aravtId: number, offer: CreateOffer) => Promise<void>;
}

export const useOffersStore = create<OffersState>((set, get) => {
  return {
    offers: [],
    isLoading: false,
    error: null,
    fetchOffers: async () => {
      set({ isLoading: true, error: null });
      try {
        const offers: Offer[] = await api.offers();
        set({ offers: offers, isLoading: false });
      } catch (err) {
        set({ 
          error: err instanceof Error ? err.message : 'Failed to fetch offers', 
          isLoading: false 
        });
      }
    },

    createOffer: async (aravtId: number, offer: CreateOffer) => {
      set({ isLoading: true, error: null });
      try {
        await api.aravt_set_offer(aravtId, offer);
        await get().fetchOffers();
        set({ isLoading: false });
      } catch (err) {
        set({ 
          error: err instanceof Error ? err.message : 'Failed to create offer',
          isLoading: false 
        });
      }
    }
  }
}); 