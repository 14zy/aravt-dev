import { api } from '@/lib/api';
import { ApplicationsGroupedListOut, JoinRequestWithAravt, Skill, UserSelf } from '@/types';
import { create } from 'zustand';

interface UserState {
  user: UserSelf | null;
  applications: JoinRequestWithAravt[];
  availableSkills: Skill[];
  isLoading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  letUserCreateAravt: (user_id: number) => Promise<void>;
  fetchAvailableSkills: () => Promise<void>;
  addSkill: (skillId: number, level: number, experienceYears: number) => Promise<void>;
  removeSkill: (skillId: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  applications: [],
  availableSkills: [],
  isLoading: false,
  error: null,
  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await api.who_am_i(); // Fetch user data from API
      const grouped: ApplicationsGroupedListOut = await api.check_my_applications();
      const applications: JoinRequestWithAravt[] = (grouped.application_groups || []).flatMap(group =>
        (group.applications || []).map(app => ({
          id: app.id,
          aravt_id: app.aravt_id,
          user: app.user,
          text: app.text,
          date_time: app.date_time,
          aravt_name: group.aravt.name,
        }))
      );
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
