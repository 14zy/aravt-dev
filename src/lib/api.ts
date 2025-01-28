import axios from './axios'
import { User, RegistrationData, CreateAravt, Aravt, Project, Business, Offer, CreateOffer, Task, JoinRequest, TaskCompletion, Skill, UserSkill, TaskColumn, CreateTaskColumn, UpdateTaskColumn, CreateTaskSkill } from '@/types'

interface MessageResponse {
  message: string
}

// Conversion helpers
interface BusinessResponse {
  id: number;
  business_id?: number;
  tasks?: Array<{ business_id?: number; [key: string]: any }>;
  task_columns?: Array<{ business_id?: number; [key: string]: any }>;
  [key: string]: any;
}

interface ProjectResponse {
  id: number;
  project_id?: number;
  tasks?: Array<{ project_id?: number; [key: string]: any }>;
  task_columns?: Array<{ project_id?: number; [key: string]: any }>;
  [key: string]: any;
}

const businessToProject = (business: BusinessResponse): Project => {
  if (!business) return business;
  const { business_id, ...rest } = business;
  
  const project: ProjectResponse = {
    ...rest,
    project_id: business_id,
    tasks: business.tasks?.map(task => {
      const { business_id: taskBusinessId, ...taskRest } = task;
      return { ...taskRest, project_id: taskBusinessId };
    }),
    task_columns: business.task_columns?.map(column => {
      const { business_id: columnBusinessId, ...columnRest } = column;
      return { ...columnRest, project_id: columnBusinessId };
    }),
  };
  
  return project as Project;
};

const projectToBusiness = (project: ProjectResponse): Business => {
  if (!project) return project;
  const { project_id, ...rest } = project;
  
  const business: BusinessResponse = {
    ...rest,
    business_id: project_id,
    tasks: project.tasks?.map(task => {
      const { project_id: taskProjectId, ...taskRest } = task;
      return { ...taskRest, business_id: taskProjectId };
    }),
    task_columns: project.task_columns?.map(column => {
      const { project_id: columnProjectId, ...columnRest } = column;
      return { ...columnRest, business_id: columnProjectId };
    }),
  };
  
  return business as Business;
};

function convertResponse(data: any): any {
  if (!data) return data;

  // Convert business to project in arrays
  if (Array.isArray(data)) {
    return data.map(item => convertResponse(item));
  }

  // Convert business to project in objects
  if (typeof data === 'object') {
    const converted = { ...data };

    // Convert business to project
    if ('business' in converted) {
      if (Array.isArray(converted.business)) {
        converted.projects = converted.business;
      } else {
        converted.project = converted.business;
      }
      delete converted.business;
    }

    // Convert business_id to project_id
    if ('business_id' in converted) {
      converted.project_id = converted.business_id;
      delete converted.business_id;
    }

    // Recursively convert nested objects
    Object.keys(converted).forEach(key => {
      if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = convertResponse(converted[key]);
      }
    });

    return converted;
  }

  return data;
}

function convertRequest(data: any): any {
  if (!data) return data;

  const converted = { ...data };

  // Convert project to business
  if ('project' in converted) {
    converted.business = converted.project;
    delete converted.project;
  } else if ('projects' in converted) {
    converted.business = converted.projects
    delete converted.projects;
  }

  // Convert project_id to business_id
  if ('project_id' in converted) {
    converted.business_id = converted.project_id;
    delete converted.project_id;
  }

  return converted;
}

export const api = {
  async login(username: string, password: string): Promise<{ access_token: string, "token_type": "bearer", user: Pick<User, 'id' | 'username' | 'email'>}> {
    const response = await axios.post('/login/', {username, password})
    return response.data
  },

  async register(data: RegistrationData): Promise<{message: string, token: string}> {
    const response = await axios.post('/registration/', data)
    return response.data
  },

  async complete_registration(token: string): Promise<{ access_token: string, "token_type": "bearer", message: string }> {
    const response = await axios.get('/complete_registration/'+`${token}`)
    return response.data
  },

  async who_am_i(): Promise<User> {
    const response = await axios.get('/who_am_i')
    return response.data
  },

  async reset_password(data: {email: string}): Promise<MessageResponse> {
    const response = await axios.post('/reset_password/', data)
    return response.data
  },

  async reset_password_complete(token: string, data: {new_password: string, repeat_password: string}): Promise<MessageResponse> {
    const response = await axios.put('/reset_password/'+`${token}`, data)
    return response.data
  },

  
  async users(): Promise<User[]> {
    const response = await axios.get('/users/')
    return response.data
  },

  async users_user(user_id: number): Promise<User> {
    const response = await axios.get('/users/user/' + `${user_id}`)
    return response.data
  },

  async users_user_subscribe(user_id: number): Promise<MessageResponse> {
    const response = await axios.post('/users/user/' + `${user_id}` + '/subscribe')
    return response.data
  },

  async users_user_unsubscribe(user_id: number): Promise<MessageResponse> {
    const response = await axios.delete('/users/user/' + `${user_id}` + '/unsubscribe')
    return response.data
  },

  async users_user_let_create_aravt(user_id: number): Promise<MessageResponse> {
    const response = await axios.put('/users/user/' + `${user_id}` + '/let_create_aravt')
    return response.data
  },

  async users_subscriptions(): Promise<User[]> {
    const response = await axios.get('/users/subscriptions/')
    return response.data
  },


  async aravt(): Promise<Aravt[]> {
    const response = await axios.get('/aravt/')
    return response.data
  },

  async aravt_aravt(aravt_id: number): Promise<Aravt> {
    const response = await axios.get('/aravt/' + `${aravt_id}`)
    return convertResponse(response.data)
  },

  async aravt_create_aravt(data: CreateAravt): Promise<Aravt> {
    const response = await axios.post('/aravt/create_aravt/', data)
    return response.data
  },

  async aravt_join(aravt_id: number, data: {aravt_id: number, text: string}): Promise<MessageResponse> {
    const response = await axios.post('/aravt/'+ `${aravt_id}` + '/join', data)
    return response.data
  },

  async aravt_drop_user(user_id: number): Promise<MessageResponse> {
    const response = await axios.delete('/aravt/drop_user/' + `${user_id}`)
    return response.data
  },

  async aravt_applications(): Promise<JoinRequest[]> {
    const response = await axios.get('/aravt/applications/')
    return response.data
  },

  async check_my_applications(): Promise<JoinRequest[]> {
    const response = await axios.get('/aravt/check_my_applications/')
    return response.data
  },

  async aravt_applications_approve(application_id: number): Promise<MessageResponse> {
    const response = await axios.post('/aravt/applications/' + `${application_id}` + '/approve')
    return response.data
  },

  async aravt_applications_reject(application_id: number): Promise<MessageResponse> {
    const response = await axios.delete('/aravt/applications/' + `${application_id}` + '/reject')
    return response.data
  },

  async aravt_set_description(data: {"description": string, "aravt_id": number}): Promise<MessageResponse> {
    const response = await axios.put('/aravt/set_description', data)
    return response.data
  },


  async tasks_get_tasks(isGlobal?: boolean): Promise<{tasks: Task[], other_tasks: Task[], parent_tasks: Task[]}> {
    const response = await axios.get('/tasks/', { params: { is_global: isGlobal } })
    return convertResponse(response.data)
  },

  async tasks_set_task(data: Omit<Task, 'id' | 'status' | 'order'>): Promise<MessageResponse> {
    const response = await axios.post('/tasks/', data)
    return response.data
  },

  async tasks_get_task(task_id: number): Promise<Task> {
    const response = await axios.get('/tasks/id' + `${task_id}`)
    return convertResponse(response.data)
  },

  async tasks_update_task(taskId: number, updates: Partial<Task>): Promise<MessageResponse> {
    const response = await axios.put(`/tasks/task/${taskId}`, convertRequest(updates))
    return response.data
  },

  async tasks_delete_task(taskId: number): Promise<MessageResponse> {
    const response = await axios.delete(`/tasks/task/${taskId}`)
    return response.data
  },

  async tasks_update_task_status(taskId: number, columnId: number, order: number): Promise<MessageResponse> {
    const response = await axios.put(`/tasks/task/${taskId}/status`, {
      column_id: columnId,
      order: order
    })
    return response.data
  },

  async tasks_all_completions(): Promise<TaskCompletion[]> {
    const response = await axios.get('/tasks/all_comletions')
    return response.data
  },

  async tasks_completions_for_task(task_completion_id: number  ): Promise<TaskCompletion> {
    const response = await axios.get('/tasks/completions_for_task_' + `${task_completion_id}`)
    return response.data
  },

  async tasks_completions_approve(task_completion_id: number  ): Promise<TaskCompletion> {
    const response = await axios.post('/tasks/completions/' + `${task_completion_id}` + '/approve')
    return response.data
  },

  async tasks_completions_reject(task_completion_id: number  ): Promise<TaskCompletion> {
    const response = await axios.delete('/tasks/completions/' + `${task_completion_id}` + '/reject')
    return response.data
  },


  async aravt_set_project(data: Omit<Project, 'id'>): Promise<MessageResponse> {
    const response = await axios.post('/aravt/set_business/', convertRequest(data))
    return convertResponse(response.data)
  },

  async aravt_set_offer(data: CreateOffer): Promise<MessageResponse> {
    const response = await axios.post('/aravt/set_offer/', data)
    return convertResponse(response.data)
  },

  async offers(): Promise<Offer[]> {
    const response = await axios.get('/offers/')
    return convertResponse(response.data)
  },

  async total_drop(): Promise<MessageResponse> {
    const response = await axios.post('/total_drop/')
    return response.data
  },

  async logout(): Promise<MessageResponse> {
    return await axios.get('/logout/')
  },

  async login_with_wallet(wallet_address: string): Promise<{ access_token: string, "token_type": "bearer", user: Pick<User, 'id' | 'username' | 'email'>}> {
    const response = await axios.post('/login_with_wallet/', { wallet_address })
    return response.data
  },

  async link_wallet(user_id: number, wallet_address: string): Promise<User> {
    const response = await axios.post(`/link_wallet/${user_id}`, { wallet_address })
    return response.data
  },

  async send_invitation(email: string, aravtId: number, referrerId: number): Promise<MessageResponse> {
    const response = await axios.post('/send_invite_link', {
      email,
      aravt_id: aravtId,
      referrer_id: referrerId
    });
    return response.data;
  },

  async link_telegram(token: string): Promise<MessageResponse> {
    const response = await axios.post('/link_telegram/' + `${token}`)
    return response.data
  },

  // Skills API methods
  async getSkills(): Promise<Skill[]> {
    const response = await axios.get('/users/skills/')
    return response.data
  },

  async createSkill(data: { name: string, description?: string }): Promise<Skill> {
    const response = await axios.post('/users/skills/', data)
    return response.data
  },

  async addUserSkill(userId: number, data: { skill_id: number, level: number, experience_years: number }): Promise<{
    message: string,
    skill: UserSkill
  }> {
    const response = await axios.post(`/users/user/${userId}/skills`, data)
    return response.data
  },

  async removeUserSkill(userId: number, skillId: number): Promise<MessageResponse> {
    const response = await axios.delete(`/users/user/${userId}/skills/${skillId}`)
    return response.data
  },

  // Task column methods
  async get_task_columns(contextId: number, isProject = false): Promise<TaskColumn[]> {
    const endpoint = isProject ? 'business' : 'aravt';
    const response = await axios.get(`/task-columns/${endpoint}/${contextId}`)
    return convertResponse(response.data)
  },

  async add_task_column(contextId: number, data: CreateTaskColumn, isProject = false): Promise<TaskColumn> {
    const endpoint = isProject ? 'business' : 'aravt';
    const response = await axios.post(`/task-columns/${endpoint}/${contextId}`, data)
    return convertResponse(response.data)
  },

  async update_task_column(columnId: number, updates: UpdateTaskColumn): Promise<TaskColumn> {
    const response = await axios.put(`/task-columns/${columnId}`, updates)
    return convertResponse(response.data)
  },

  async delete_task_column(columnId: number): Promise<MessageResponse> {
    const response = await axios.delete(`/task-columns/${columnId}`)
    return response.data
  },

  // Task skills methods
  async update_task_skills(taskId: number, skills: CreateTaskSkill[]): Promise<MessageResponse> {
    const response = await axios.put(`/tasks/task/${taskId}/skills`, { skills })
    return response.data
  }
}

// Skills
export const getSkills = () => axios.get('/users/skills/').then(response => response.data);

export const addUserSkill = (userId: number, skillData: { skill_id: number; level: number; experience_years: number }) =>
  axios.post(`/users/user/${userId}/skills`, skillData).then(response => response.data);

export const removeUserSkill = (userId: number, skillId: number) =>
  axios.delete(`/users/user/${userId}/skills/${skillId}`).then(response => response.data);

// Tasks
export const tasks_get_tasks = (isGlobal?: boolean) => 
  axios.get('/tasks/', { params: { is_global: isGlobal } }).then(response => response.data);

export const tasks_set_task = (data: Omit<Task, 'id' | 'status' | 'order'>) =>
  axios.post('/tasks/', data).then(response => response.data);

export const tasks_update_task = (taskId: number, data: Partial<Task>) =>
  axios.put(`/tasks/task/${taskId}`, data).then(response => response.data);

export const tasks_update_task_status = (taskId: number, columnId: number, order: number) =>
  axios.put(`/tasks/task/${taskId}/status`, {
    column_id: columnId,
    order: order
  }).then(response => response.data);

export const tasks_delete_task = (taskId: number) =>
  axios.delete(`/tasks/task/${taskId}`).then(response => response.data);

// Task Skills
export const update_task_skills = (taskId: number, skills: CreateTaskSkill[]) =>
  axios.put(`/tasks/task/${taskId}/skills`, { skills }).then(response => response.data);

// Task Columns
export const get_task_columns = (contextId: number, isProject: boolean) =>
  axios.get(`/${isProject ? 'business' : 'aravt'}/${contextId}/task-columns`).then(response => response.data);

export const add_task_column = (contextId: number, isProject: boolean, name: string) =>
  axios.post(`/${isProject ? 'business' : 'aravt'}/${contextId}/task-columns`, { name }).then(response => response.data);

export const update_task_column = (columnId: number, data: Partial<TaskColumn>) =>
  axios.put(`/task-columns/${columnId}`, data).then(response => response.data);

export const delete_task_column = (columnId: number) =>
  axios.delete(`/task-columns/${columnId}`).then(response => response.data);

