
import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { isEKYCEnrolled } from '@/lib/ekycStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Routes where we skip the eKYC check entirely
const EKYC_EXEMPT_PATHS = ['/biometric-setup', '/ekyc/verify'];

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  // null = still loading, true = enrolled, false = confirmed not enrolled
  const [ekycStatus, setEkycStatus] = useState<boolean | null>(null);
  const checkedUidRef = useRef<string | null>(null);

  useEffect(() => {
    // If no user, we know the answer immediately
    if (!user) {
      setEkycStatus(null); // reset so next login does a fresh check
      return;
    }

    // Only re-query when the user actually changes (uid), NOT on every route change.
    // Re-checking on every route change causes a null flash → redirect to /biometric-setup
    // whenever the user navigates (e.g. after completing setup and navigating to /).
    if (checkedUidRef.current === user.id) {
      return;
    }

    // Mark this uid as in-flight so concurrent effects don't double-fire
    checkedUidRef.current = user.id;
    setEkycStatus(null); // loading

    isEKYCEnrolled(user.id).then((enrolled) => {
      setEkycStatus(enrolled);
    });
  }, [user]);

  // Invalidate the cache when the user arrives back at a protected route from
  // biometric-setup (so freshly-enrolled users see the correct state)
  useEffect(() => {
    if (user && location.pathname === '/' && checkedUidRef.current === user.id) {
      // Re-check once when landing on / (home) so enrollment is freshly read
      isEKYCEnrolled(user.id).then((enrolled) => {
        setEkycStatus(enrolled);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ─── LOADING GUARD ───────────────────────────────────────────────────────
  // Show spinner while:
  //   • Auth is still resolving (loading)
  //   • We have a user but ekyc check is still in flight (ekycStatus === null)
  // NEVER redirect while null — only redirect when CONFIRMED false.
  if (loading || (user && ekycStatus === null)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── AUTH GUARD ───────────────────────────────────────────────────────────
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ─── EKYC GUARD ───────────────────────────────────────────────────────────
  // Only redirect when confirmed false — never when null/undefined
  if (ekycStatus === false && !EKYC_EXEMPT_PATHS.includes(location.pathname)) {
    return <Navigate to="/biometric-setup" replace />;
  }

  return <>{children}</>;
};
