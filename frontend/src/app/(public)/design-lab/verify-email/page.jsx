'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VerifyEmailScreen } from '@/components/ui/auth/verify-email-screen';
import { FintechLoaderOverlay } from '@/components/ui/loaders/FintechLoaderOverlay';
import { toast } from '@/components/ui/feedback/use-toast';
import { Button } from '@/components/ui/primitives/button';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || 'urva@cointrack.in';
  const queryStatus = searchParams.get('status');

  const [status, setStatus] = useState(queryStatus || 'loading'); // 'loading', 'success', 'already', 'error'
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    searchParams.get('loggedIn') === 'true'
  );

  // FintechLoader overlay state when redirecting to dashboard
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoaderActive, setIsLoaderActive] = useState(true);

  // Auto-verify simulation: if arrived from email link (or loading state), simulate async token validation
  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => {
        setStatus('success');
        toast({
          title: 'Email Verified',
          description: 'Your email address has been verified successfully.',
        });
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      setResent(true);
      toast({
        title: 'Verification Sent',
        description: `A new verification email was sent to ${emailParam}.`,
      });
      setTimeout(() => setResent(false), 3000);
    }, 1500);
  };

  const handleContinue = () => {
    // Show FintechLoader transition overlay before entering dashboard
    setIsFinalizing(true);
    setIsLoaderActive(true);

    setTimeout(() => {
      // Trigger card retraction inside FintechLoader
      setIsLoaderActive(false);
    }, 2500);
  };

  const handleFinalized = () => {
    // Navigates to dashboard as verified (clears pending banner)
    router.push(
      `/design-lab/dashboard?verified=true&email=${encodeURIComponent(emailParam)}`
    );
  };

  const handleBackToLogin = () => {
    if (isLoggedIn) {
      router.push(
        `/design-lab/dashboard?verified=${status === 'success'}&email=${encodeURIComponent(emailParam)}`
      );
    } else {
      router.push('/design-lab/login');
    }
  };

  return (
    <div className='relative min-h-screen'>
      <VerifyEmailScreen
        status={status}
        message={
          status === 'error'
            ? 'The verification link has expired or is invalid.'
            : ''
        }
        isChange={false}
        onContinue={handleContinue}
        onBackToLogin={handleBackToLogin}
        onResend={status === 'error' ? handleResend : undefined}
        isResending={isResending}
        resent={resent}
        isLoggedIn={isLoggedIn}
      />

      {/* From Email Verification to Dashboard: FintechLoader overlay */}
      {isFinalizing && (
        <FintechLoaderOverlay
          title='Email Verified Successfully'
          subtitle='Synchronizing account permissions...'
          completionTitle='Verification Complete'
          completionSubtitle='Redirecting to dashboard...'
          userIdentifier={emailParam}
          isLoaderActive={isLoaderActive}
          onComplete={handleFinalized}
        />
      )}

      {/* Quick Debug Controls for UI Testing */}
      <div className='fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-background/90 backdrop-blur-md border border-border/70 p-2 sm:p-2.5 rounded-2xl shadow-xl flex items-center gap-1.5 sm:gap-2'>
        <span className='text-[11px] font-semibold text-muted-foreground mr-1'>
          Test State:
        </span>
        <Button
          variant={status === 'loading' ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs px-2.5'
          onClick={() => setStatus('loading')}
        >
          Loading
        </Button>
        <Button
          variant={status === 'success' ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs px-2.5'
          onClick={() => setStatus('success')}
        >
          Success
        </Button>
        <Button
          variant={status === 'error' ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs px-2.5'
          onClick={() => setStatus('error')}
        >
          Error
        </Button>

        <div className='w-px h-5 bg-border mx-1' />

        <Button
          variant={isLoggedIn ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs px-2.5'
          onClick={() => setIsLoggedIn(!isLoggedIn)}
        >
          {isLoggedIn ? 'Logged In' : 'Logged Out'}
        </Button>
      </div>

      <DesignLabAuthNav />
    </div>
  );
}

export default function VerifyEmailDesignLab() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-background' />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
