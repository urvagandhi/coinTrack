// src/app/(access)/layout.js
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FintechLoaderOverlay } from '@/components/ui/loaders/FintechLoaderOverlay';

export default function AccessLayout({ children }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isLoaderActive, setIsLoaderActive] = useState(true);

  const isAllowedWhenAuthenticated =
    pathname?.includes('/verify-email') ||
    pathname?.includes('/setup-2fa') ||
    pathname?.includes('/reset-');

  useEffect(() => {
    if (!isInitializing && isAuthenticated && !isAllowedWhenAuthenticated) {
      // Intercept the redirect to show the ultra-premium 3D loader!
      setShowOverlay(true);
      setIsLoaderActive(true);

      const timer = setTimeout(() => {
        setIsLoaderActive(false); // Triggers the inject animation
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isInitializing, isAllowedWhenAuthenticated]);

  if (isInitializing) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Loader2 size={20} className='animate-spin text-muted-foreground' />
      </div>
    );
  }

  // When authenticated, unmount the login forms and show the cinematic loader
  // EXCEPT for routes like verify-email which must process tokens even while authenticated
  if (isAuthenticated && !isAllowedWhenAuthenticated) {
    return (
      <div className='min-h-screen bg-background'>
        <FintechLoaderOverlay
          isVisible={showOverlay}
          isLoaderActive={isLoaderActive}
          userIdentifier={user?.email || user?.username || ''}
          onComplete={() => {
            router.replace('/dashboard');
          }}
        />
      </div>
    );
  }

  return <div className='min-h-screen bg-background'>{children}</div>;
}
