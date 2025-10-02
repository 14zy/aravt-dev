import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const authorized = useAuthStore(state => Boolean(state.isAuthenticated || state.user || state.token));
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    const aravtId = location.pathname.match(/\/aravts\/(\d+)/)?.[1];


    if (ref || aravtId) {
      useAuthStore.getState().setReferralInfo({
        referredById: ref ? parseInt(ref) : undefined,
        aravtId: aravtId ? parseInt(aravtId) : undefined,
      });
    }
  }, [location]);

  if (!authorized) {
    return <Navigate to={`/login${location.search}`} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 