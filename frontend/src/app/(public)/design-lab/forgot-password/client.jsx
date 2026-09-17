'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ForgotPasswordScreen } from '@/components/ui/auth/forgot-password-screen';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

export default function DesignLabForgotPasswordClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedIdentifier, setSubmittedIdentifier] = useState('');

  const handleSubmit = async ({ identifier }) => {
    setLoading(true);
    setSubmittedIdentifier(identifier);
    // Simulate network delay in design lab
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <main className='w-full min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden relative'>
      <ForgotPasswordScreen
        onSubmit={handleSubmit}
        onBackToLogin={() => router.push('/design-lab/login')}
        isLoading={loading}
        isSubmitted={submitted}
        submittedIdentifier={submittedIdentifier}
        onResetSubmitted={() => {
          setSubmitted(false);
          setSubmittedIdentifier('');
        }}
      />
      <DesignLabAuthNav />
    </main>
  );
}
