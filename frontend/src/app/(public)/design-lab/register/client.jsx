'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterScreen } from '@/features/auth';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGoogleSource = searchParams.get('source') === 'google';

  const [mode, setMode] = useState(
    isGoogleSource ? 'complete-profile' : 'register'
  );
  const [initialData, setInitialData] = useState(
    isGoogleSource
      ? {
          name: 'Urva Gandhi',
          email: 'urva@cointrack.in',
          username: 'urva_gandhi',
        }
      : {}
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isGoogleSource) {
      setMode('complete-profile');
      setInitialData({
        name: 'Urva Gandhi',
        email: 'urva@cointrack.in',
        username: 'urva_gandhi',
      });
    }
  }, [isGoogleSource]);

  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    // Simulate network request to Google OAuth
    setTimeout(() => {
      setInitialData({
        name: 'Urva Gandhi',
        email: 'urva@cointrack.in',
        username: 'urva_gandhi',
      });
      setMode('complete-profile');
      setIsGoogleLoading(false);
    }, 1000);
  };

  const handleRegister = data => {
    setIsLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setIsLoading(false);
      const email = data.email || initialData.email || 'urva@cointrack.in';
      const provider = mode === 'complete-profile' ? 'google' : 'manual';
      // Mandatory 2FA setup on first registration for both Google and Manual
      router.push(
        `/design-lab/setup-2fa?provider=${provider}&email=${encodeURIComponent(email)}`
      );
    }, 1200);
  };

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden relative'>
      <RegisterScreen
        mode={mode}
        initialData={initialData}
        isLoading={isLoading}
        isGoogleLoading={isGoogleLoading}
        onGoogleSignUp={handleGoogleSignUp}
        onRegister={handleRegister}
        onLoginRedirect={() => router.push('/design-lab/login')}
      />
      <DesignLabAuthNav />
    </main>
  );
}

export default function DesignLabRegisterClient() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-background' />}>
      <RegisterContent />
    </Suspense>
  );
}
