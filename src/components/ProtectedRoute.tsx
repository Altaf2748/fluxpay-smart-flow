
import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { isEKYCEnrolled } from '@/lib/ekycStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Routes where we bypass the eKYC check entirely
const EKYC_EXEMPT_PATHS = ['/biometric-setup', '/ekyc/verify'];

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [ekycChecked, setEkycChecked] = useState(false);
  const [ekycDone, setEkycDone] = useState(false);

  const checkEnrollment = useCallback(async (uid: string) => {
    setEkycChecked(false);
    const enrolled = await isEKYCEnrolled(uid);
    setEkycDone(enrolled);
    setEkycChecked(true);
  }, []);

  useEffect(() => {
    if (!user) {
      setEkycDone(false);
      setEkycChecked(true);
      return;
    }
    checkEnrollment(user.id);
  }, [user, location.pathname, checkEnrollment]);

  // Show spinner while auth is loading OR while eKYC check is in flight
  if (loading || !ekycChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If eKYC not done and not already on an exempt page, redirect
  if (!ekycDone && !EKYC_EXEMPT_PATHS.includes(location.pathname)) {
    return <Navigate to="/biometric-setup" replace />;
  }

  return <>{children}</>;
};
