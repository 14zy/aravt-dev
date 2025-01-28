import { create } from 'zustand'
import { api } from '@/lib/api'
import { Task, TaskFilters, TaskSort, TaskColumn, CreateTaskSkill, CreateTaskColumn, UpdateTaskColumn } from '@/types'

interface TaskResponse {
  tasks: Task[];
}

interface TasksState {
  localTasks: Task[];
  globalTasks: Task[];
  taskColumns: TaskColumn[];
  filters: TaskFilters;
  sort: TaskSort;
  isLoading: boolean;
  error: string | null;
  
  // Task Methods
  fetchTasksData: () => Promise<void>;
  updateTaskStatus: (taskId: number, columnId: number, order: number) => Promise<void>;
  updateTaskIsDone: (taskId: number, isDone: boolean) => Promise<void>;
  createTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  
  // Task Column Methods
  fetchTaskColumns: (contextId?: number, isProject?: boolean) => Promise<void>;
  addTaskColumn: (contextId: number, name: string, isProject?: boolean) => Promise<void>;
  updateTaskColumn: (columnId: number, updates: UpdateTaskColumn) => Promise<void>;
  deleteTaskColumn: (columnId: number) => Promise<void>;
  createDefaultColumns: (contextId: number, isProject: boolean) => Promise<void>;
  reorderColumns: (columnId: number, newOrder: number) => Promise<void>;
  
  // Task Skills Methods
  updateTaskSkills: (taskId: number, skills: CreateTaskSkill[]) => Promise<void>;
  
  // Filter and Sort Methods
  setFilters: (filters: TaskFilters) => void;
  setSort: (sort: TaskSort) => void;
  getFilteredAndSortedTasks: (tasks: Task[]) => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  localTasks: [],
  globalTasks: [],
  taskColumns: [],
  filters: {},
  sort: { field: 'order', direction: 'asc' },
  isLoading: false,
  error: null,

  setFilters: (filters) => set({ filters }),
  setSort: (sort) => set({ sort }),

  fetchTasksData: async () => {
    set({ isLoading: true, error: null });
    try {
      const localResponse = await api.tasks_get_tasks() as TaskResponse;
      const globalResponse = await api.tasks_get_tasks() as TaskResponse;
      
      set({ 
        localTasks: localResponse.tasks.filter(task => !task.is_global), 
        globalTasks: globalResponse.tasks.filter(task => task.is_global), 
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Failed to fetch tasks', isLoading: false });
      console.error('Error fetching tasks:', error);
    }
  },

  createTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      await api.tasks_set_task(task);
      await get().fetchTasksData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create task', isLoading: false });
    }
  },

  updateTask: async (taskId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await api.tasks_update_task(taskId, updates);
      await get().fetchTasksData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update task', isLoading: false });
    }
  },

  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      await api.tasks_delete_task(taskId);
      set(state => ({
        localTasks: state.localTasks.filter(task => task.id !== taskId),
        globalTasks: state.globalTasks.filter(task => task.id !== taskId),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete task', isLoading: false });
    }
  },

  fetchTaskColumns: async (contextId?: number, isProject?: boolean) => {
    if (!contextId) return;
    set({ isLoading: true, error: null });
    try {
      const columns = await api.get_task_columns(contextId, isProject || false);
      set({ taskColumns: Array.isArray(columns) ? columns : [], isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch task columns', isLoading: false });
      console.error('Error fetching task columns:', error);
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

  updateTaskColumn: async (columnId: number, updates: UpdateTaskColumn) => {
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

  createDefaultColumns: async (contextId: number, isProject: boolean) => {
    const defaultColumns = ['backlog', 'in_progress', 'review', 'done'];
    try {
      set({ isLoading: true, error: null });
      for (const name of defaultColumns) {
        await get().addTaskColumn(contextId, name, isProject);
      }
    } catch (error) {
      set({ error: 'Failed to create default columns' });
    } finally {
      set({ isLoading: false });
    }
  },

  reorderColumns: async (columnId: number, newOrder: number) => {
    try {
      set({ isLoading: true, error: null });
      await api.update_task_column(columnId, { order: newOrder });
      await get().fetchTaskColumns(columnId);
    } catch (error) {
      set({ error: 'Failed to reorder columns' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTaskSkills: async (taskId: number, skills: CreateTaskSkill[]) => {
    try {
      set({ isLoading: true, error: null });
      await api.update_task_skills(taskId, skills);
      await get().fetchTasksData();
    } catch (error) {
      set({ error: 'Failed to update task skills' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTaskStatus: async (taskId: number, columnId: number, order: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.tasks_update_task_status(taskId, columnId, order);
      await get().fetchTasksData();
    } catch (error) {
      set({ error: 'Failed to update task status', isLoading: false });
      console.error('Error updating task status:', error);
    }
  },

  updateTaskIsDone: async (taskId: number, isDone: boolean) => {
    set({ isLoading: true, error: null });
    try {
      await api.tasks_update_task(taskId, { is_done: isDone });
      await get().fetchTasksData();
    } catch (error) {
      set({ error: 'Failed to update task completion status', isLoading: false });
      console.error('Error updating task completion:', error);
    }
  },

  getFilteredAndSortedTasks: (tasks: Task[]) => {
    const { filters, sort } = get();
    let filteredTasks = [...tasks];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.due_date_from) {
      filteredTasks = filteredTasks.filter(task => 
        new Date(task.date_time) >= new Date(filters.due_date_from!)
      );
    }

    if (filters.due_date_to) {
      filteredTasks = filteredTasks.filter(task => 
        new Date(task.date_time) <= new Date(filters.due_date_to!)
      );
    }

    if (filters.skills?.length) {
      filteredTasks = filteredTasks.filter(task =>
        task.skills.some(skill =>
          filters.skills!.includes(skill.id) && skill.level >= (filters.required_level || 1)
        )
      );
    }

    // Apply sorting
    return filteredTasks.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'date_time': {
          comparison = new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
          break;
        }
        case 'order': {
          comparison = a.order - b.order;
          break;
        }
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  },
})); 