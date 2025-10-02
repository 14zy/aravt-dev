import { api } from '@/lib/api';
import { AravtDetails, AravtMember, JoinRequest, Task } from '@/types';
import { create } from 'zustand';

interface AdminStats {
  totalMembers: number;
  activeTasks: number;
  taskCompletion: number;
  averageRating: number;
  totalRewards: string;
  pendingRequests: number;
}

interface AravtSettings {
  name: string;
  description: string;
  telegramLink?: string;
  maxMembers: number;
  taskSettings: {
    requireApproval: boolean;
    minReward: number;
    maxReward: number;
    defaultRewardType: 'AT' | 'USDT';
  };
  memberSettings: {
    allowSelfJoin: boolean;
    requireKYC: boolean;
    minRating: number;
  };
}

interface AdminState {
  stats: AdminStats;
  members: AravtMember[];
  pendingRequests: JoinRequest[];
  tasks: Task[];
  aravt: AravtDetails | null;
  isLoading: boolean;
  error: string | null;
  fetchAravtData: (aravtId: number) => Promise<void>;
  fetchAravtApplications: (aravtId: number) => Promise<void>;
  approveRequest: (requestId: number) => Promise<void>;
  rejectRequest: (requestId: number) => Promise<void>;
  updateMemberRole: (userId: number, role: string) => Promise<void>;
  removeMember: (userId: number, aravtId: number) => Promise<void>;
  createTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  settings: AravtSettings;
  updateSettings: (updates: Partial<AravtSettings>) => Promise<void>;
  inviteMember: (email: string, aravtId: number) => Promise<void>;
}

export const useAdminStore = create<AdminState>()((set, get) => {
  return {
    stats: {
      totalMembers: 25,
      activeTasks: 12,
      taskCompletion: 85,
      averageRating: 4.7,
      totalRewards: '25,000 USDT',
      pendingRequests: 3,
    },
    members: [],
    pendingRequests: [],
    tasks: [],
    aravt: null,
    isLoading: false,
    error: null,
    settings: {
      name: 'ARAVT SYSTEMS',
      description: 'Founders Aravt',
      telegramLink: 'https://t.me/aravtsystems',
      maxMembers: 100,
      taskSettings: {
        requireApproval: true,
        minReward: 100,
        maxReward: 10000, 
        defaultRewardType: 'AT',
      },
      memberSettings: {
        allowSelfJoin: false,
        requireKYC: true,
        minRating: 4.0,
      },
    },

    fetchAravtData: async (aravtId: number) => {
      set({ isLoading: true, error: null });
      try {
        const details: AravtDetails = await api.aravt_aravt(aravtId);
        const list: AravtMember[] = [
          ...(details.leader ? [details.leader] : []),
          ...(details.team || []),
        ];
        set({ members: list, aravt: details, isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch admin data', 
          isLoading: false 
        });
      }
    },

    fetchAravtApplications: async (aravtId: number) => {
      set({ isLoading: true, error: null });
      try {
        const grouped = await api.aravt_applications_for(aravtId);
        const pending: JoinRequest[] = (grouped.application_groups || []).flatMap(group =>
          (group.applications || []).map(app => ({
            id: app.id,
            aravt_id: app.aravt_id,
            user: app.user,
            text: app.text as unknown as string,
            date_time: app.date_time,
          }))
        );
        set({ pendingRequests: pending, isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch aravt applications', 
          isLoading: false 
        });
      }
    },

    approveRequest: async (requestId: number) => {
      set({ isLoading: true, error: null });
      try {
        await api.aravt_applications_approve(requestId)
        
        const state = get();
        const updatedRequests = state.pendingRequests.filter(req => req.id !== requestId);
        set({ 
          pendingRequests: updatedRequests,
          stats: {
            ...state.stats,
            pendingRequests: state.stats.pendingRequests - 1,
            totalMembers: state.stats.totalMembers + 1,
          },
          isLoading: false,
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to approve request', 
          isLoading: false 
        });
      }
    },

    rejectRequest: async (requestId: number) => {
      set({ isLoading: true, error: null });
      try {
        await api.aravt_applications_reject(requestId)
        
        const state = get();
        const updatedRequests = state.pendingRequests.filter(req => req.id !== requestId);
        set({ 
          pendingRequests: updatedRequests,
          stats: {
            ...state.stats,
            pendingRequests: state.stats.pendingRequests - 1,
          },
          isLoading: false,
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to reject request', 
          isLoading: false 
        });
      }
    },

    updateMemberRole: async (userId: number, role: string) => {
      set({ isLoading: true, error: null });
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const state = get();
        const updatedMembers = state.members.map(member => {
          if (member.id !== userId) return member;
          return { ...member, role };
        });
        set({ members: updatedMembers, isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update member role', 
          isLoading: false 
        });
      }
    },

    removeMember: async (userId: number, aravtId: number) => {
      set({ isLoading: true, error: null });
      try {
        await api.aravt_drop_user(aravtId, userId);
        const state = get();
        const updatedMembers = state.members.filter(member => member.id !== userId);
        set({ 
          members: updatedMembers,
          stats: {
            ...state.stats,
            totalMembers: state.stats.totalMembers - 1,
          },
          isLoading: false,
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to remove member', 
          isLoading: false 
        });
      }
    },

    createTask: async () => {
      set({ isLoading: true, error: null });
      try {
        // TODO: подключить актуальный эндпоинт задач при необходимости
        set({ isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create task', 
          isLoading: false 
        });
      }
    },

    updateTask: async (taskId, updates) => {
      set({ isLoading: true, error: null });
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
          isLoading: false,
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update task', 
          isLoading: false 
        });
      }
    },

    deleteTask: async (taskId) => {
      set({ isLoading: true, error: null });
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== taskId),
          isLoading: false,
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete task', 
          isLoading: false 
        });
      }
    },

    updateSettings: async (updates) => {
      set({ isLoading: true, error: null });
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set(state => ({
          settings: {
            ...state.settings,
            ...updates,
          },
          isLoading: false,
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update settings', 
          isLoading: false 
        });
      }
    },

    inviteMember: async (email: string, aravtId: number) => {
      set({ isLoading: true, error: null });
      try {
        await api.send_invitation(email, aravtId);
        await get().fetchAravtApplications(aravtId);
      } catch {
        set({ error: 'Failed to invite member' });
      } finally {
        set({ isLoading: false });
      }
    },
  }
}); 