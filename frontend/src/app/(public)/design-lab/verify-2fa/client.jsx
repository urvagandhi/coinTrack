'use client';

import { useCallback, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TwoFactorVerifyScreen } from '@/components/ui/auth/two-factor-verify-screen';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

function Verify2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userEmail = searchParams.get('email') || 'urva.gandhi@gmail.com';
  const provider = searchParams.get('provider') || 'manual';

  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isLoaderActive, setIsLoaderActive] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (code, isRecovery) => {
    setError('');
    setLoading(true);

    // Simulate validation network latency
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);

    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const valid = isRecovery
      ? normalized === '8F2A9B3C'
      : normalized === '123456';

    if (valid) {
      // Start the finalizing overlay with FintechLoader
      setFinalizing(true);
      setIsLoaderActive(true);

      const minAnimationTime = new Promise(r => setTimeout(r, 3000));
      const fetchData = new Promise(r => setTimeout(r, 500));

      await Promise.all([minAnimationTime, fetchData]);

      // Trigger the retract animation inside the loader
      setIsLoaderActive(false);
    } else {
      setError(
        'Invalid code. Please try again. (Hint: 123456 or recovery code 8F2A9B3C)'
      );
    }
  }, []);

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden relative'>
      <TwoFactorVerifyScreen
        userIdentifier={userEmail}
        onSubmit={handleSubmit}
        onBackToLogin={() => router.push('/design-lab/login')}
        onNavigateToSetup={() =>
          router.push(
            `/design-lab/setup-2fa?email=${encodeURIComponent(userEmail)}`
          )
        }
        isLoading={loading}
        isFinalizing={finalizing}
        isLoaderActive={isLoaderActive}
        onFinalizationComplete={() => {
          // Manual user is logged in, but email verification is ASYNC -> lands on dashboard with pending banner
          const isVerified = provider === 'google';
          router.push(
            `/design-lab/dashboard?provider=${provider}&verified=${isVerified}&email=${encodeURIComponent(userEmail)}`
          );
        }}
        errorMessage={error}
        onClearError={() => setError('')}
        recoveryCodesUsed={3}
      />
      <DesignLabAuthNav />
    </main>
  );
}

export default function DesignLabVerify2FAClient() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-background' />}>
      <Verify2FAContent />
    </Suspense>
  );
}
