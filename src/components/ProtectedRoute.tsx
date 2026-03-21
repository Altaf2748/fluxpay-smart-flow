
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { isEKYCEnrolled } from '@/lib/ekycStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [ekycChecked, setEkycChecked] = useState(false);
  const [ekycDone, setEkycDone] = useState(false);

  useEffect(() => {
    if (!user) {
      setEkycChecked(true);
      return;
    }
    isEKYCEnrolled(user.id).then((enrolled) => {
      setEkycDone(enrolled);
      setEkycChecked(true);
    });
  }, [user]);

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

  // If eKYC not done and not already on the setup page, redirect
  if (!ekycDone && location.pathname !== '/biometric-setup') {
    return <Navigate to="/biometric-setup" replace />;
  }

  return <>{children}</>;
};
