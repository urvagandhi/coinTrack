'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TwoFactorSetupScreen } from '@/features/auth';
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

  const [backupCodes, setBackupCodes] = useState([]);

  const handleVerify = async () => {
    await new Promise(r => setTimeout(r, 600));
    const codes = [
      '8F2A-9B3C',
      '1E4D-7C5F',
      '3A9B-2E8D',
      '6C1F-4B7A',
      '9D5E-2A1B',
      '4F8C-3E7D',
      '2B6A-9F4C',
      '7E1D-5C8B',
    ];
    setBackupCodes(codes);
    return { success: true, backupCodes: codes };
  };

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden relative'>
      <TwoFactorSetupScreen
        userEmail={userEmail}
        secretKey='JBSWY3DPEHPK3PXP'
        onVerify={handleVerify}
        backupCodes={backupCodes}
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
