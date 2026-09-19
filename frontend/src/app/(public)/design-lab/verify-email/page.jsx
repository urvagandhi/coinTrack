'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VerifyEmailScreen } from '@/components/ui/auth/verify-email-screen';
import { FintechLoaderOverlay } from '@/components/ui/loaders/FintechLoaderOverlay';
import { toast } from '@/components/ui/feedback/use-toast';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || 'urva@cointrack.in';
  const queryStatus = searchParams.get('status');

  const [status, setStatus] = useState(queryStatus || 'loading'); // 'loading', 'success', 'already', 'error'
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

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
