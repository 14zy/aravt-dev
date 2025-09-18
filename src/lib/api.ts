import {
  Aravt,
  CreateAravt,
  CreateOffer,
  JoinRequest,
  Offer,
  Project,
  RegistrationData,
  Skill,
  Task,
  TaskCompletion,
  User,
  UserSkill,
} from '@/types';
import type { AxiosError } from 'axios';
import axios from './axios';

interface MessageResponse {
  message: string;
}

export const api = {
  async login(
    username: string,
    password: string
  ): Promise<{
    access_token: string;
    token_type: 'bearer';
    user: Pick<User, 'id' | 'username' | 'email'>;
  }> {
    try {
      const response = await axios.post('/login/', { username, password });
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail?: string }>;
      const detailMessage = error.response?.data?.detail;
      if (detailMessage) {
        throw new Error(detailMessage);
      }
      throw err;
    }
  },

  async register(
    data: RegistrationData
  ): Promise<{ message: string; token: string }> {
    const response = await axios.post('/registration/', data);
    return response.data;
  },

  async complete_registration(
    token: string
  ): Promise<{ access_token: string; token_type: 'bearer'; message: string }> {
    const response = await axios.get('/complete_registration/' + `${token}`);
    return response.data;
  },

  // async link_telegram(token: string): Promise<{ access_token: string, "token_type": "bearer", message: string }> {
  //   const response = await axios.get('/link_telegram/'+`${token}`)
  //   return response.data
  // },

  async who_am_i(): Promise<User> {
    const response = await axios.get('/who_am_i');
    return response.data;
  },

  async reset_password(data: { email: string }): Promise<MessageResponse> {
    const response = await axios.post('/reset_password/', data);
    return response.data;
  },

  async reset_password_complete(
    token: string,
    data: { new_password: string; repeat_password: string }
  ): Promise<MessageResponse> {
    const response = await axios.put('/reset_password/' + `${token}`, data);
    return response.data;
  },

  async users(): Promise<User[]> {
    const response = await axios.get('/users/');
    return response.data;
  },

  async users_user(user_id: number): Promise<User> {
    const response = await axios.get('/users/user/' + `${user_id}`);
    return response.data;
  },

  async users_user_subscribe(user_id: number): Promise<MessageResponse> {
    const response = await axios.post(
      '/users/user/' + `${user_id}` + '/subscribe'
    );
    return response.data;
  },

  async users_user_unsubscribe(user_id: number): Promise<MessageResponse> {
    const response = await axios.delete(
      '/users/user/' + `${user_id}` + '/unsubscribe'
    );
    return response.data;
  },

  async users_user_let_create_aravt(user_id: number): Promise<MessageResponse> {
    const response = await axios.put(
      '/users/user/' + `${user_id}` + '/let_create_aravt'
    );
    return response.data;
  },

  async users_subscriptions(): Promise<User[]> {
    const response = await axios.get('/users/subscriptions/');
    return response.data;
  },

  async aravt(): Promise<Aravt[]> {
    const response = await axios.get('/aravt/');
    return response.data;
  },

  async aravt_aravt(aravt_id: number): Promise<Aravt> {
    const response = await axios.get('/aravt/' + `${aravt_id}`);
    return response.data;
  },

  async aravt_create_aravt(data: CreateAravt): Promise<Aravt> {
    const response = await axios.post('/aravt/create_aravt/', data);
    return response.data;
  },

  async aravt_join(
    aravt_id: number,
    data: { aravt_id: number; text: string }
  ): Promise<MessageResponse> {
    const response = await axios.post(
      '/aravt/' + `${aravt_id}` + '/join',
      data
    );
    return response.data;
  },

  async aravt_drop_user(user_id: number): Promise<MessageResponse> {
    const response = await axios.delete('/aravt/drop_user/' + `${user_id}`);
    return response.data;
  },

  async aravt_applications(): Promise<JoinRequest[]> {
    const response = await axios.get('/aravt/applications/');
    return response.data;
  },

  async check_my_applications(): Promise<JoinRequest[]> {
    const response = await axios.get('/aravt/check_my_applications/');
    return response.data;
  },

  async aravt_applications_approve(
    application_id: number
  ): Promise<MessageResponse> {
    const response = await axios.post(
      '/aravt/applications/' + `${application_id}` + '/approve'
    );
    return response.data;
  },

  async aravt_applications_reject(
    application_id: number
  ): Promise<MessageResponse> {
    const response = await axios.delete(
      '/aravt/applications/' + `${application_id}` + '/reject'
    );
    return response.data;
  },

  async aravt_set_description(data: {
    description: string;
    aravt_id: number;
  }): Promise<MessageResponse> {
    const response = await axios.put('/aravt/set_description', data);
    return response.data;
  },

  async tasks_set_task(data: Omit<Task, 'id'>): Promise<MessageResponse> {
    const response = await axios.post('/tasks/set_task/', data);
    return response.data;
  },

  async tasks_get_tasks(): Promise<{
    tasks: Task[];
    other_tasks: Task[];
    parent_tasks: Task[];
  }> {
    const response = await axios.get('/tasks/');
    return response.data;
  },

  async tasks_get_task(task_id: number): Promise<Task> {
    const response = await axios.get('/tasks/id' + `${task_id}`);
    return response.data;
  },

  async tasks_update_task(
    task_id: number,
    data: Partial<Task>
  ): Promise<MessageResponse> {
    const response = await axios.put(
      '/tasks/task/' + `${task_id}` + '/complete',
      { task_id: task_id, body: data }
    );
    return response.data;
  },

  async tasks_all_completions(): Promise<TaskCompletion[]> {
    const response = await axios.get('/tasks/all_comletions');
    return response.data;
  },

  async tasks_completions_for_task(
    task_completion_id: number
  ): Promise<TaskCompletion> {
    const response = await axios.get(
      '/tasks/completions_for_task_' + `${task_completion_id}`
    );
    return response.data;
  },

  async tasks_completions_approve(
    task_completion_id: number
  ): Promise<TaskCompletion> {
    const response = await axios.post(
      '/tasks/completions/' + `${task_completion_id}` + '/approve'
    );
    return response.data;
  },

  async tasks_completions_reject(
    task_completion_id: number
  ): Promise<TaskCompletion> {
    const response = await axios.delete(
      '/tasks/completions/' + `${task_completion_id}` + '/reject'
    );
    return response.data;
  },

  async aravt_set_business(
    data: Omit<Project, 'id'>
  ): Promise<MessageResponse> {
    const response = await axios.post('/aravt/set_business/', data);
    return response.data;
  },

  async aravt_set_offer(data: CreateOffer): Promise<MessageResponse> {
    const response = await axios.post('/aravt/set_offer/', data);
    return response.data;
  },

  async offers(): Promise<Offer[]> {
    const response = await axios.get('/offers/');
    return response.data;
  },

  async total_drop(): Promise<MessageResponse> {
    const response = await axios.post('/total_drop/');
    return response.data;
  },

  async logout(): Promise<MessageResponse> {
    return await axios.get('/logout/');
  },

  async login_with_wallet(wallet_address: string): Promise<{
    access_token: string;
    token_type: 'bearer';
    user: Pick<User, 'id' | 'username' | 'email'>;
  }> {
    const response = await axios.post('/login_with_wallet/', {
      wallet_address,
    });
    return response.data;
  },

  async link_wallet(user_id: number, wallet_address: string): Promise<User> {
    const response = await axios.post(`/link_wallet/${user_id}`, {
      wallet_address,
    });
    return response.data;
  },

  async send_invitation(email: string): Promise<MessageResponse> {
    const response = await axios.post('/aravt/invite/', {
      email,
      // aravt_id: aravtId,
      // referrer_id: referrerId
    });
    return response.data;
  },

  async link_telegram(token: string): Promise<MessageResponse> {
    const response = await axios.post('/link_telegram/' + `${token}`);
    return response.data;
  },

  // Skills API methods
  async getSkills(): Promise<Skill[]> {
    const response = await axios.get('/users/skills/');
    return response.data;
  },

  async createSkill(data: {
    name: string;
    description?: string;
  }): Promise<Skill> {
    const response = await axios.post('/users/skills/', data);
    return response.data;
  },

  async addUserSkill(
    userId: number,
    data: { skill_id: number; level: number; experience_years: number }
  ): Promise<{
    message: string;
    skill: UserSkill;
  }> {
    const response = await axios.post(`/users/user/${userId}/skills`, data);
    return response.data;
  },

  async removeUserSkill(
    userId: number,
    skillId: number
  ): Promise<MessageResponse> {
    const response = await axios.delete(
      `/users/user/${userId}/skills/${skillId}`
    );
    return response.data;
  },
};
