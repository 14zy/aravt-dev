import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import type { AravtDetails, UserAravtLink } from '@/types';
import { useEffect, useMemo } from 'react';

export interface UseSelectedAravtResult {
  currentAravtId?: number;
  firstAravtId?: number;
  currentAravt: AravtDetails | null;
  setCurrentAravtId: (id: number | undefined) => void;
  options: Array<{ id: number; name: string }>
}

export function useSelectedAravt(): UseSelectedAravtResult {
  const user = useAuthStore((s) => s.user);
  const {
    currentAravtId,
    setCurrentAravtId,
    getFirstAravtIdForUser,
    fetchAravtDetails,
    aravtDetails,
  } = useAravtsStore();

  const firstAravtId = useMemo(() => getFirstAravtIdForUser(user?.aravts as UserAravtLink[] | undefined), [getFirstAravtIdForUser, user?.aravts]);
  const effectiveId = currentAravtId ?? firstAravtId;

  useEffect(() => {
    if (!currentAravtId && firstAravtId) {
      setCurrentAravtId(firstAravtId);
    }
  }, [currentAravtId, firstAravtId, setCurrentAravtId]);

  useEffect(() => {
    if (effectiveId) {
      fetchAravtDetails(effectiveId);
    }
  }, [effectiveId, fetchAravtDetails]);

  const options = useMemo(() => {
    const links = (user?.aravts ?? []) as UserAravtLink[];
    return links.map((l) => ({ id: l.aravt.id, name: l.aravt.name ?? `Aravt #${l.aravt.id}` }));
  }, [user?.aravts]);

  return {
    currentAravtId: effectiveId,
    firstAravtId,
    currentAravt: aravtDetails,
    setCurrentAravtId,
    options,
  };
}

export default useSelectedAravt;


