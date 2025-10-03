import type { User } from '@/types';

export function isUserLeaderOfAravt(user: User | null | undefined, aravtId?: number): boolean {
  if (!user || !aravtId) return false;
  const links = user.aravts || [];
  return links.some(link => link.aravt?.id === aravtId && link.is_leader_of_aravt);
}

export function canManageAravt(user: User | null | undefined, aravtId?: number): boolean {
  // Alias для читаемости в местах, где нужна проверка прав управления
  return isUserLeaderOfAravt(user, aravtId);
}


