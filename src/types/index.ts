export interface UserSkill extends Skill {
  level: number;
  experience_years: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'SuperAdmin' | 'AravtLeader' | 'User';
  city?: string;
  date_of_birth?: string;
  full_name?: string;
  is_active: boolean;
  is_deleted: boolean;
  refered_by_id?: number;
  able_to_create_aravt: boolean;
  able_to_create_tasks: boolean;
  is_leader_of_aravt: boolean;
  rating?: number;
  aravt_id?: number;
  aravt?: Aravt | null;
  skills?: UserSkill[];
  tasksCompleted?: number;
  completionRate?: number;
  tokenBalance?: number;
  is_subordinate?: boolean;
  wallet_address?: string;
}

export interface Aravt {
  id: number;
  name: string;
  description: string;
  user_father_id: number;
  responsible_user_id: number;
  init_user_id: number;
  is_draft: boolean;
  telegram_chat_link: string;
  leader: User;
  team: User[];
  aravt_father: Aravt | null;
  projects: Project[];
  offers: Offer[];
  skills: string[];
  tasks: Task[];
  task_columns?: TaskColumn[];
  wallet_address?: string;
}

export interface Feature {
  id: number;
  type: 'community' | 'tasks' | 'rewards';
  title: string;
  description: string;
  badge: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  city: string;
  date_of_birth: string;
  full_name: string;
}

export type CreateAravt = Pick<Aravt, 'name' | 'description' | 'init_user_id'>;

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';
export type TaskSortField = 'priority' | 'due_date' | 'order' | 'date_time';
export type SortDirection = 'asc' | 'desc';

export interface TaskFilters {
  search?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date_from?: string;
  due_date_to?: string;
  skills?: number[];
  required_level?: number;
}

export interface TaskSkill {
  id: number;
  name: string;
  description: string;
  level: number;
  experience_years: number;
}

export interface TaskColumn {
  id: number;
  name: string;
  order: number;
  aravt_id?: number;
  project_id?: number;
}

export type BusinessStatus = 'Posted' | 'NotPosted';

export interface Project {
  id: number;
  name: string;
  description: string;
  link?: string;
  fundings?: {
    amount: number;
    currency: string;
  }[];
  logo?: string;
  Status: BusinessStatus;
  location?: string;
  aravt_id: number;
  aravt?: Aravt;
  tasks?: Task[];
  task_columns?: TaskColumn[];
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
}

// Business type is only used in API layer
export type Business = Project;

export interface Task {
  id: number;
  title: string;
  description: string;
  link?: string;
  reward: number;
  one_time: boolean;
  reward_type: 'AT' | 'USDT';
  priority: 'low' | 'medium' | 'high';
  defenition_of_done: Record<string, any>;
  aravt_id: number;
  project_id?: number;
  responsible_users_ids?: number[];
  date_time: string;
  due_date?: string;
  is_global: boolean;
  is_done: boolean;
  order: number;
  column: TaskColumn;
  skills: TaskSkill[];
  completions: {
    completions_amount: number;
    is_completion_approved: boolean;
    num_of_approved: number;
  };
}

export interface Offer {
  id: number;
  project: Project;
  aravt: {
    id: number;
    name: string;
    description: string;
    is_draft: boolean;
  };
  name: string;
  description: string;
  is_limited: boolean;
  count_left?: number;
  duration?: number;
  price: number;
  assets?: any;
}

export interface CreateOffer {
  name: string;
  project_id: number;
  description: string;
  is_limited: boolean;
  count_left: number;
  duration: number;
  price: number;
  assets: {};
}

export interface JoinRequest {
  id: number;
  aravt_id: number;
  user: User;
  text: {
    application: string;
  };
  date_time: string;
}

export interface TaskCompletion {
  id: number;
  task: Partial<Task>;
  user: Partial<User>;
  body: {};
  completed_at: string;
  is_approved: boolean;
  reward_paid: boolean;
}

export interface Skill {
  id: number;
  name: string;
  description: string;
}

export interface TaskSort {
  field: 'order' | 'priority' | 'date_time';
  direction: 'asc' | 'desc';
}

export interface CreateTaskColumn {
  name: string;
}

export interface UpdateTaskColumn {
  name?: string;
  order?: number;
}

export interface CreateTaskSkill {
  skill_id: number;
  level: number;
}
