'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterScreen } from '@/components/ui/auth/register-screen';

export default function DesignLabRegisterClient() {
  const router = useRouter();
  const [mode, setMode] = useState('register');
  const [initialData, setInitialData] = useState({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    // Simulate network request to Google and our backend
    setTimeout(() => {
      setInitialData({
        name: 'Urva Gandhi',
        email: 'urva@cointrack.in',
        username: 'urva_gandhi',
      });
      setMode('complete-profile');
      setIsGoogleLoading(false);
    }, 1500);
  };

  const handleRegister = data => {
    setIsLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setIsLoading(false);
      router.push('/design-lab/setup-2fa');
    }, 1500);
  };

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden'>
      <RegisterScreen
        mode={mode}
        initialData={initialData}
        isLoading={isLoading}
        isGoogleLoading={isGoogleLoading}
        onGoogleSignUp={handleGoogleSignUp}
        onRegister={handleRegister}
        onLoginRedirect={() => router.push('/design-lab/login')}
      />
    </main>
  );
}
