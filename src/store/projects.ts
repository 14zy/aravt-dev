import { api } from '@/lib/api';
import { Project } from '@/types';
import { create } from 'zustand';

interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  // fetchProjects: () => Promise<void>;
  fetchProjectsForAravt: (aravt_id: number) => Promise<void>;
  createProject: (aravt_id: number, project: Omit<Project, 'id'>) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set) => {
  return {
    projects: [],
    isLoading: false,
    error: null,
    /* 
    fetchProjects: async () => {
      set({ isLoading: true, error: null });
      try {
        const projects: Project[] = await api.projects()
        set({ projects: projects, isLoading: false });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to fetch projects', isLoading: false });
      }
    },
    */
    fetchProjectsForAravt: async (aravt_id: number) => {
      set({ isLoading: true, error: null });
      try {
        const user_aravt = await api.aravt_aravt(aravt_id);
        const projects: Project[] = user_aravt.business ?? [];
        set({ projects: projects, isLoading: false });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to fetch projects', isLoading: false });
      }
    },
    createProject: async (aravt_id: number, project: Omit<Project, 'id'>) => {
      set({ isLoading: true, error: null });
      try {
        await api.aravt_set_business(aravt_id, project);
        const { fetchProjectsForAravt } = useProjectsStore.getState();
        await fetchProjectsForAravt(aravt_id);
        set({ isLoading: false });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to create project', isLoading: false });
      }
    }
  }
}); 