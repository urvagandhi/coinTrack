'use client';

import { tokenManager } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/AuthContext';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/setup-2fa',
  '/reset-2fa',
];

const AUTH_ONLY_ROUTES = ['/login', '/register'];
const CALCULATOR_PREFIX = '/calculators';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isInitializing, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRecoveringSession, setIsRecoveringSession] = useState(false);

  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith(CALCULATOR_PREFIX);

  const storedToken =
    typeof window !== 'undefined' ? tokenManager.getToken() : null;
  const hasValidStoredToken =
    !!storedToken && !tokenManager.isTokenExpired(storedToken);

  useEffect(() => {
    if (isInitializing) return;

    // If client memory hasn't hydrated user yet, but a valid token is in storage, recover session
    if (
      !isAuthenticated &&
      hasValidStoredToken &&
      refreshUser &&
      !isRecoveringSession
    ) {
      setIsRecoveringSession(true);
      refreshUser().catch(() => {
        setIsRecoveringSession(false);
      });
      return;
    }

    if (
      !isAuthenticated &&
      !isPublic &&
      !hasValidStoredToken &&
      !isRecoveringSession
    ) {
      // Preserve full URL including query params (critical for OAuth callbacks like Zerodha)
      const qs = typeof window !== 'undefined' ? window.location.search : '';
      const fullPath = qs ? `${pathname}${qs}` : pathname;
      router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
      return;
    }

    if (isAuthenticated && AUTH_ONLY_ROUTES.includes(pathname)) {
      router.replace('/dashboard');
    }
  }, [
    isAuthenticated,
    isInitializing,
    isPublic,
    hasValidStoredToken,
    isRecoveringSession,
    pathname,
    refreshUser,
    router,
  ]);

  if (
    isInitializing ||
    isRecoveringSession ||
    (!isAuthenticated && hasValidStoredToken)
  ) {
    return (
      <div className='fixed inset-0 bg-background flex flex-col items-center justify-center gap-3'>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className='w-10 h-10 rounded-full border-2 border-hairline border-t-foreground'
        />
        <span className='text-sm text-muted-foreground'>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return null;
  }

  return children;
}
