import { create } from 'zustand'
import { api } from '@/lib/api'

interface DashboardStats {
  tasksCompleted: number;
  totalTasks: number;
  tokensEarned: number;
  usdtEarned: number;
  rank: number;
  rankProgress: number;
}

interface DashboardState {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  updateTaskIsDone: (taskId: number, is_done: boolean) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: {
    tasksCompleted: 12,
    totalTasks: 15,
    tokensEarned: 2450,
    usdtEarned: 1200,
    rank: 2,
    rankProgress: 65,
  },
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ 
        isLoading: false 
      });
    } catch (error) {
      if (error instanceof Error) {
        set({ error: error.message, isLoading: false });
      } else {
        set({ error: 'Failed to fetch dashboard data', isLoading: false });
      }
    }
  },

  updateTaskIsDone: async (taskId: number, is_done: boolean) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const state = get();

      set({
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof Error) {
        set({ error: error.message, isLoading: false });
      } else {
        set({ error: 'Failed to update task completion', isLoading: false });
      }
    }
  },
})); 