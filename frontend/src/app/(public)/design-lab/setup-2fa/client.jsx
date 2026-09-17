'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TwoFactorSetupScreen } from '@/components/ui/auth/two-factor-setup-screen';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

function Setup2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userEmail = searchParams.get('email') || 'urva@cointrack.in';

  const handleComplete = () => {
    // As per specifications: after mandatory 2FA setup on first registration/google signup, redirect to login
    router.push(
      '/design-lab/login?message=2FA%20Setup%20Complete.%20Please%20sign%20in%20to%20continue.'
    );
  };

  const handleNavigateToVerify = () => {
    // Cross-link: Setup 2FA -> Verify 2FA
    router.push(
      `/design-lab/verify-2fa?email=${encodeURIComponent(userEmail)}`
    );
  };

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden relative'>
      <TwoFactorSetupScreen
        userEmail={userEmail}
        onComplete={handleComplete}
        onCancel={() => router.push('/design-lab/login')}
        onNavigateToVerify={handleNavigateToVerify}
      />
      <DesignLabAuthNav />
    </main>
  );
}

export default function DesignLabSetup2FAClient() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-background' />}>
      <Setup2FAContent />
    </Suspense>
  );
}
