'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginScreen } from '@/features/auth';
import { FintechLoaderOverlay } from '@/shared/ui/loaders/FintechLoaderOverlay';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoaderActive, setIsLoaderActive] = useState(true);
  const [customError, setCustomError] = useState(
    searchParams.get('error') || ''
  );

  // Retrieve any flash messages passed from Setup 2FA or Registration
  const successMessage = searchParams.get('message') || '';

  const handleLogin = ({ email }) => {
    setCustomError('');
    setIsLoading(true);

    // Simulate login verification latency
    setTimeout(() => {
      setIsLoading(false);
      const userEmail = email?.trim() || 'urva.gandhi@gmail.com';
      // Manual login requires 2FA verification before dashboard
      router.push(
        `/design-lab/verify-2fa?email=${encodeURIComponent(userEmail)}`
      );
    }, 700);
  };

  const handleGoogleLogin = () => {
    // When Google OAuth finishes connecting, show our FintechLoader overlay before entering dashboard
    setIsFinalizing(true);
    setIsLoaderActive(true);

    setTimeout(() => {
      // Trigger card retraction inside FintechLoader
      setIsLoaderActive(false);
    }, 2500);
  };

  const handleGoogleFinalized = () => {
    // For existing Google users: direct to dashboard, NO TOTP, email already verified
    router.push(
      '/design-lab/dashboard?provider=google&verified=true&email=urva.gandhi@gmail.com'
    );
  };

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden relative'>
      <LoginScreen
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onRegister={() => router.push('/design-lab/register')}
        onForgotPassword={() => router.push('/design-lab/forgot-password')}
        isLoading={isLoading}
        errorMessage={customError}
        successMessage={successMessage}
      />

      {/* From Login to Dashboard transition loader */}
      {isFinalizing && (
        <FintechLoaderOverlay
          title='Google Authentication Successful'
          subtitle='Initializing wealth portfolio...'
          completionTitle='Session Authenticated'
          completionSubtitle='Opening dashboard...'
          userIdentifier='urva.gandhi@gmail.com'
          isLoaderActive={isLoaderActive}
          onComplete={handleGoogleFinalized}
        />
      )}

      <DesignLabAuthNav />
    </main>
  );
}

export default function DesignLabLoginClient() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-background' />}>
      <LoginContent />
    </Suspense>
  );
}

