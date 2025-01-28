import { create } from 'zustand'
import { Project } from '@/types'
import { api } from '@/lib/api'
import { TaskColumn, TaskFilters, TaskSort } from '@/types' 

interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  taskColumns: TaskColumn[];
  filters: TaskFilters;
  sort: TaskSort;
  fetchTaskColumns: (contextId: number, isProject?: boolean) => Promise<void>;
  addTaskColumn: (contextId: number, name: string, isProject?: boolean) => Promise<void>;
  updateTaskColumn: (columnId: number, updates: Partial<TaskColumn>) => Promise<void>;
  deleteTaskColumn: (columnId: number) => Promise<void>;
  // fetchProjects: () => Promise<void>;
  fetchProjectsForAravt: (aravt_id: number) => Promise<void>;
  createProject: (aravt_id: number, project: Omit<Project, 'id'>) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set) => {
  return {
    projects: [],
    isLoading: false,
    error: null,
    taskColumns: [],
    filters: {},
    sort: { field: 'order', direction: 'asc' },
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
    fetchTaskColumns: async (contextId: number, isProject = false) => {
      try {
        set({ isLoading: true, error: null });
        const columns = await api.get_task_columns(contextId, isProject);
        set({ taskColumns: columns });
      } catch (error) {
        set({ error: 'Failed to fetch task columns' });
        console.error('Error fetching task columns:', error);
      } finally {
        set({ isLoading: false });
      }
    },
  
    addTaskColumn: async (contextId: number, name: string, isProject = false) => {
      try {
        set({ isLoading: true, error: null });
        const response = await api.add_task_column(contextId, { name }, isProject);
        set(state => ({
          taskColumns: [...state.taskColumns, response]
        }));
      } catch (error) {
        set({ error: 'Failed to add task column' });
        console.error('Error adding task column:', error);
      } finally {
        set({ isLoading: false });
      }
    },
  
    updateTaskColumn: async (columnId: number, updates: Partial<TaskColumn>) => {
      try {
        set({ isLoading: true, error: null });
        const response = await api.update_task_column(columnId, updates);
        set(state => ({
          taskColumns: state.taskColumns.map(col => 
            col.id === columnId ? { ...col, ...response } : col
          )
        }));
      } catch (error) {
        set({ error: 'Failed to update task column' });
        console.error('Error updating task column:', error);
      } finally {
        set({ isLoading: false });
      }
    },
  
    deleteTaskColumn: async (columnId: number) => {
      try {
        set({ isLoading: true, error: null });
        await api.delete_task_column(columnId);
        set(state => ({
          taskColumns: state.taskColumns.filter(col => col.id !== columnId)
        }));
      } catch (error) {
        set({ error: 'Failed to delete task column' });
        console.error('Error deleting task column:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchProjectsForAravt: async (aravt_id: number) => {
      set({ isLoading: true, error: null });
      try {
        const user_aravt = await api.aravt_aravt(aravt_id);
        const projects: Project[] = user_aravt.projects;
        set({ projects: projects, isLoading: false });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to fetch projects', isLoading: false });
      }
    },
    createProject: async (aravt_id: number, project: Omit<Project, 'id'>) => {
      set({ isLoading: true, error: null });
      try {
        await api.aravt_set_project(project);
        const { fetchProjectsForAravt } = useProjectsStore.getState();
        await fetchProjectsForAravt(aravt_id);
        set({ isLoading: false });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to create project', isLoading: false });
      }
    }
  }
}); 