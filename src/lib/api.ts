import axios from './axios'
import { User, RegistrationData, CreateAravt, Aravt, Project, Offer, Task, JoinRequest } from '@/types'

interface MessageResponse {
  message: string
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
    return response.data
  },

  async aravt_create_aravt(data: CreateAravt): Promise<Aravt> {
    const response = await axios.post('/aravt/create_aravt/', data)
    return response.data
  },

  async aravt_join(aravt_id: number, data: {aravt_id: number, text: string}): Promise<MessageResponse> {
    const response = await axios.post('/aravt/'+ `${aravt_id}` + '/join', data)
    return response.data
  },

  async aravt_applications(): Promise<JoinRequest[]> {
    const response = await axios.get('/aravt/applications/')
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

  async aravt_set_task(data: Omit<Task, 'id'>): Promise<MessageResponse> {
    const response = await axios.post('/aravt/set_task/', data)
    return response.data
  },

  async aravt_get_tasks(): Promise<Task[]> {
    const response = await axios.get('/aravt/get_tasks/')
    return response.data
  },

  async aravt_set_business(data: Project): Promise<MessageResponse> {
    const response = await axios.post('/aravt/set_business/', data)
    return response.data
  },

  async aravt_set_offer(data: Offer): Promise<MessageResponse> {
    const response = await axios.post('/aravt/set_offer/', data)
    return response.data
  },

  async offers(): Promise<Offer[]> {
    const response = await axios.get('/offers')
    return response.data
  },

  async total_drop(): Promise<MessageResponse> {
    const response = await axios.post('/total_drop/')
    return response.data
  },

  async logout(): Promise<MessageResponse> {
    return await axios.get('/logout/')
  }
}