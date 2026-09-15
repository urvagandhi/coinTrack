'use client';

import { useRouter } from 'next/navigation';
import { TwoFactorSetupScreen } from '@/components/ui/auth/two-factor-setup-screen';

export default function DesignLabSetup2FAClient() {
  const router = useRouter();

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden'>
      <TwoFactorSetupScreen
        onComplete={() => router.push('/design-lab/login')}
        onCancel={() => router.back()}
      />
    </main>
  );
}
