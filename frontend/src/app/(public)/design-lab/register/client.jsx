'use client';

import { useRouter } from 'next/navigation';
import { RegisterScreen } from '@/components/ui/auth/register-screen';

export default function DesignLabRegisterClient() {
  const router = useRouter();

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden'>
      <RegisterScreen
        onLoginRedirect={() => router.push('/design-lab/login')}
      />
    </main>
  );
}
