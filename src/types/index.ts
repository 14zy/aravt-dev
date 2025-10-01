export interface UserSkill extends Skill {
  level: number;
  experience_years: number;
}

export interface UserSelf {
  id: number
  username: string
  email?: string
  city?: string
  date_of_birth?: string
  full_name?: string
  is_active: boolean
  skills: UserSkill[]
  aravts: AravtBrief[]
  wallet_address: string | null
}

export interface User {
  id: number
  username: string
  email?: string
  city?: string
  date_of_birth?: string
  full_name?: string
  is_active: boolean
  skills: UserSkill[]
  aravts: UserAravtLink[]
  wallet_address: string | null
}

export interface AravtListItem {
  id: number;
  name: string;
  description: string;
  responsible_user_id: number;
  is_draft: boolean;
  wallet_address: string | null;
}

export interface UserShort {
  id: number;
  username: string;
  full_name: string;
  city: string;
  is_active: boolean;
  email?: string | null;
  date_of_birth?: string | null;
  is_deleted?: boolean;
  refered_by_id?: number | null;
}

export interface AravtDetails {
  id: number;
  name: string;
  user_father_id: number;
  responsible_user_id: number;
  is_draft: boolean;
  description: string;
  telegram_chat_link: string | null;
  aravt_father: string[];
  leader: UserShort;
  team: UserShort[];
  business: Project[];
  offers: AravtOffer[];
}

export interface AravtShort {
  id: number;
  name: string | null;
  user_father_id: number | null;
  is_draft: boolean;
}

export interface UserAravtLink {
  aravt: AravtShort;
  is_leader_of_aravt: boolean;
  able_to_create_tasks: boolean;
  able_to_create_aravt: boolean;
}

export interface AravtBrief {
  id: number;
  name: string;
  able_to_create_tasks: boolean;
  able_to_create_aravt: boolean;
  is_leader_of_aravt: boolean;
  user_father_id: number;
  is_draft: boolean;
  wallet_address: string | null;
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
  username: string
  email: string
  password: string
  city: string
  date_of_birth: string
  full_name: string
}

export interface CreateAravt {
  name: string;
  description: string;
  aravt_father_id: number;
}

export interface Task {
  id: number,
  title: string,
  description: string,
  link?: string,
  reward: number,
  reward_type: 'AT' | 'USDT';
  definition_of_done: Record<string, unknown>,
  responsible_users_ids: number[],
  is_done: boolean,
  is_global: boolean
  date_time: string
  priority: 'low' | 'medium' | 'high';
  one_time: boolean;
  business?: Project | null;
  business_id?: number;
  completions: {
    completions_amount: number,
    is_completion_approved: boolean,
    num_of_approved: number
  }
}

export type ProjectStatus = 'Posted' | 'Not Posted';

export interface Project {
  id: number;
  name: string;
  description: string;
  link: string | null;
  fundings: string | null;
  logo: string | null;
  status: ProjectStatus;
  location: string;
}

export interface Offer {
  id: number;
  business: Project;
  aravt: {
    id: number;
    name: string;
    description: string;
    is_draft: boolean;
  };
  name: string;
  description: string;
  is_limited: boolean;
  count_left: number | null;
  duration: number | null;
  price: number;
  assets: Record<string, unknown> | null;
}

export interface AravtOffer {
  id: number;
  business_id: number;
  name: string;
  description: string;
  is_limited: boolean;
  count_left: number | null;
  duration: number | null;
  price: number;
  assets: Record<string, unknown> | null;
}

export interface CreateOffer {
  name: string;
  business_id: number;
  description: string;
  is_limited: boolean;
  count_left: number;
  duration: number;
  price: number;
  assets: Record<string, unknown>;
}

export interface JoinRequest {
  id: number,
  aravt_id: number,
  user: UserShort,
  text: string,
  date_time: string
}

export interface ApplicationOut {
  id: number;
  aravt_id: number;
  user: UserShort;
  text: string;
  date_time: string;
}

export interface ApplicationsGroupOut {
  aravt: AravtShort;
  applications: ApplicationOut[];
}

export interface ApplicationsGroupedListOut {
  application_groups: ApplicationsGroupOut[];
}

export interface JoinRequestWithAravt extends JoinRequest {
  aravt_name: string | null;
}

export interface TaskCompletion {
  id: number,
  task: Partial<Task>,
  user: Partial<User>,
  body: Record<string, unknown>,
  completed_at: string,
  is_approved: boolean,
  reward_paid: boolean
}

export interface Skill {
  id: number;
  name: string;
  description: string;
}
