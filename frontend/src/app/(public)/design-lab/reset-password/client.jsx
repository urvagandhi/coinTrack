'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResetPasswordScreen } from '@/components/ui/auth/reset-password-screen';
import { FintechLoaderOverlay } from '@/components/ui/loaders/FintechLoaderOverlay';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';
import { Button } from '@/components/ui/primitives/button';

export default function DesignLabResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(
    tokenParam !== 'expired' && tokenParam !== 'invalid'
  );

  // Update token state if query param changes
  useEffect(() => {
    if (tokenParam === 'expired' || tokenParam === 'invalid') {
      setIsTokenValid(false);
    } else if (tokenParam === 'valid') {
      setIsTokenValid(true);
    }
  }, [tokenParam]);

  // Loader overlay states (only shown after form submission)
  const [showLoader, setShowLoader] = useState(false);
  const [isLoaderActive, setIsLoaderActive] = useState(true);

  const handleSubmit = async () => {
    setLoading(true);

    // Simulate network submission delay
    setTimeout(() => {
      setLoading(false);
      setShowLoader(true);
      setIsLoaderActive(true);

      // Simulate completion sequence
      setTimeout(() => {
        setIsLoaderActive(false);
      }, 1800);
    }, 1000);
  };

  return (
    <main className='relative min-h-screen'>
      {showLoader && (
        <FintechLoaderOverlay
          isVisible={showLoader}
          title='Updating Your Password'
          subtitle='Securing your account with your new credentials...'
          completionTitle='Password Updated Successfully'
          completionSubtitle='Redirecting you to sign in to your account...'
          isLoaderActive={isLoaderActive}
          onComplete={() => router.push('/design-lab/login')}
        />
      )}

      <ResetPasswordScreen
        isTokenValid={isTokenValid}
        onSubmit={handleSubmit}
        onBackToLogin={() => router.push('/design-lab/login')}
        isLoading={loading}
      />

      {/* Quick Debug Controls for UI Testing */}
      <div className='fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-background/90 backdrop-blur-md border border-border/70 p-2 sm:p-2.5 rounded-2xl shadow-xl flex items-center gap-1.5 sm:gap-2'>
        <span className='text-[11px] font-semibold text-muted-foreground mr-1'>
          Test State:
        </span>
        <Button
          variant={isTokenValid ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs px-2.5'
          onClick={() => setIsTokenValid(true)}
        >
          Valid Token
        </Button>
        <Button
          variant={!isTokenValid ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs px-2.5'
          onClick={() => setIsTokenValid(false)}
        >
          Expired Link
        </Button>
      </div>

      <DesignLabAuthNav />
    </main>
  );
}
