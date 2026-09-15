'use client';

import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/ui/auth/login-screen';

export default function DesignLabLoginClient() {
  const router = useRouter();

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden'>
      <LoginScreen
        onLogin={() => router.push('/design-lab/verify-2fa')}
        onRegister={() => router.push('/design-lab/register')}
        onForgotPassword={() => router.push('/design-lab/forgot-password')}
      />
    </main>
  );
}
