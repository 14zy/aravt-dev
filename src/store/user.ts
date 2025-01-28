import { create } from 'zustand';
import { api } from '@/lib/api';
import { User, JoinRequest, Skill, UserSkill } from '@/types';

interface UserState {
  user: User | null;
  all_users: User[];
  applications: JoinRequest[];
  availableSkills: Skill[];
  isLoading: boolean;
  error: string | null;
  fetchAllUsers: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  letUserCreateAravt: (user_id: number) => Promise<void>;
  fetchAvailableSkills: () => Promise<void>;
  addSkill: (skillId: number, level: number, experienceYears: number) => Promise<void>;
  removeSkill: (skillId: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  all_users: [],
  applications: [],
  availableSkills: [],
  isLoading: false,
  error: null,
  fetchAllUsers: async () => {
    const all_users = await api.users();
    set({ all_users });
  },
  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await api.who_am_i(); // Fetch user data from API
      const applications: JoinRequest[] = await api.check_my_applications();
      set({ user, applications, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch user profile', isLoading: false });
    }
  },
  letUserCreateAravt: async (user_id: number) => {
    set({ isLoading: true, error: null })
    try {
      await api.users_user_let_create_aravt(user_id);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to let user create aravt', isLoading: false });
    }
  },
  fetchAvailableSkills: async () => {
    try {
      const skills = await api.getSkills();
      set({ availableSkills: skills });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch skills' });
    }
  },
  addSkill: async (skillId: number, level: number, experienceYears: number) => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const result = await api.addUserSkill(user.id, {
        skill_id: skillId,
        level,
        experience_years: experienceYears
      });
      
      // Update user skills in state
      set({ 
        user: {
          ...user,
          skills: [...(user.skills || []), result.skill]
        },
        isLoading: false 
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add skill', isLoading: false });
    }
  },
  removeSkill: async (skillId: number) => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      await api.removeUserSkill(user.id, skillId);
      
      // Update user skills in state
      set({ 
        user: {
          ...user,
          skills: user.skills?.filter(skill => skill.id !== skillId) || []
        },
        isLoading: false 
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove skill', isLoading: false });
    }
  }
})); 
