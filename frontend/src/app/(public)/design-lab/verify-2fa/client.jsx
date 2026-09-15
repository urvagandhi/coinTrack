'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TwoFactorVerifyScreen } from '@/components/ui/auth/two-factor-verify-screen';

export default function DesignLabVerify2FAClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // This state controls whether the loader is visible
  const [finalizing, setFinalizing] = useState(false);

  // This state controls whether the loader is in its "ejected" (true) or "retracting" (false) state
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
      // Start the finalizing overlay
      setFinalizing(true);
      setIsLoaderActive(true);

      // Orchestrate: wait for BOTH the network call AND the minimum animation time
      const minAnimationTime = new Promise(r => setTimeout(r, 3000));

      // Simulating the actual data fetching (e.g. user profile, portfolio)
      const fetchData = new Promise(r => setTimeout(r, 500));

      await Promise.all([minAnimationTime, fetchData]);

      // Trigger the retract animation inside the loader
      setIsLoaderActive(false);
    } else {
      setError('Invalid code. Please try again.');
    }
  }, []);

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden'>
      <TwoFactorVerifyScreen
        userIdentifier='urva.gandhi@gmail.com'
        onSubmit={handleSubmit}
        onBackToLogin={() => router.push('/design-lab/login')}
        isLoading={loading}
        isFinalizing={finalizing}
        isLoaderActive={isLoaderActive}
        onFinalizationComplete={() => {
          // Called when the loader finishes retracting
          router.push('/design-lab/dashboard');
        }}
        errorMessage={error}
        onClearError={() => setError('')}
        recoveryCodesUsed={3}
      />
    </main>
  );
}
