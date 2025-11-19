import { api } from '@/lib/api';
import { DISABLE_CACHE } from '@/lib/env';
import { dedupe, shouldRevalidate } from '@/lib/swrCache';
import { useAuthStore } from '@/store/auth';
import { ApplicationsGroupedListOut, JoinRequestWithAravt, Skill, User } from '@/types';
import { create } from 'zustand';

interface UserState {
  user: User | null;
  applications: JoinRequestWithAravt[];
  availableSkills: Skill[];
  isLoading: boolean;
  error: string | null;
  profileFetchedAt: number | null;
  skillsFetchedAt: number | null;
  fetchUserProfile: (opts?: { force?: boolean; ttlMs?: number }) => Promise<void>;
  letUserCreateAravt: (user_id: number, aravt_id: number) => Promise<void>;
  fetchAvailableSkills: (opts?: { force?: boolean; ttlMs?: number }) => Promise<void>;
  addSkill: (skillId: number, level: number, experienceYears: number) => Promise<void>;
  removeSkill: (skillId: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  applications: [],
  availableSkills: [],
  isLoading: false,
  error: null,
  profileFetchedAt: null,
  skillsFetchedAt: null,
  fetchUserProfile: async (opts) => {
    const { profileFetchedAt } = get();
    const ttl = opts?.ttlMs ?? 0;
    const authUser = useAuthStore.getState().user;

    // Return cached and optionally revalidate in background
    if (profileFetchedAt && !opts?.force && !DISABLE_CACHE) {
      if (shouldRevalidate(profileFetchedAt, ttl) && authUser) {
        void dedupe('user/profile', async () => {
          try {
            const freshUser = await api.users_user(authUser.id);
            const grouped: ApplicationsGroupedListOut = await api.check_my_applications();
            const freshApps: JoinRequestWithAravt[] = mapApplications(grouped);
            set({ user: freshUser, applications: freshApps, profileFetchedAt: Date.now() });
          } catch (e) {
            console.error('SWR refresh user/profile failed', e);
          }
        });
      }
      return;
    }

    set({ isLoading: true, error: null });
    try {
      if (!authUser) {
        console.error('No auth.user');
        set({ isLoading: false });
        return;
      }
      const freshUser = await dedupe('user/profile', () => api.users_user(authUser.id));
      const grouped: ApplicationsGroupedListOut = await api.check_my_applications();
      const applications: JoinRequestWithAravt[] = mapApplications(grouped);
      set({ user: freshUser, applications, isLoading: false, profileFetchedAt: Date.now() });
    } catch (error) {
      console.error('fetchUserProfile failed', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch user profile', isLoading: false });
    }
  },
  letUserCreateAravt: async (user_id: number, aravt_id: number) => {
    set({ isLoading: true, error: null })
    try {
      await api.users_user_let_create_aravt(user_id, aravt_id);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to let user create aravt', isLoading: false });
    }
  },
  fetchAvailableSkills: async (opts) => {
    const { skillsFetchedAt } = get();
    const ttl = opts?.ttlMs ?? 0;
    if (skillsFetchedAt && !opts?.force && !DISABLE_CACHE) {
      if (shouldRevalidate(skillsFetchedAt, ttl)) {
        void dedupe('user/skills', async () => {
          try {
            const fresh = await api.getSkills();
            set({ availableSkills: fresh, skillsFetchedAt: Date.now() });
          } catch (e) {
            console.error('SWR refresh user/skills failed', e);
          }
        });
      }
      return;
    }
    try {
      const skills = await dedupe('user/skills', () => api.getSkills());
      set({ availableSkills: skills, skillsFetchedAt: Date.now() });
    } catch (error) {
      console.error('fetchAvailableSkills failed', error);
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

function mapApplications(grouped: ApplicationsGroupedListOut): JoinRequestWithAravt[] {
  return (grouped.application_groups || []).flatMap(group =>
    (group.applications || []).map(app => ({
      id: app.id,
      aravt_id: app.aravt_id,
      user: app.user,
      text: app.text,
      date_time: app.date_time,
      aravt_name: group.aravt.name,
    }))
  );
}
