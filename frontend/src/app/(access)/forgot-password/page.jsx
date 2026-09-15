'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { passwordAPI } from '@/lib/api';
import { ForgotPasswordScreen } from '@/components/ui/auth/forgot-password-screen';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedIdentifier, setSubmittedIdentifier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async ({ identifier }) => {
    setError('');
    setLoading(true);
    setSubmittedIdentifier(identifier);

    try {
      await passwordAPI.forgot(identifier);
      setSubmitted(true);
    } catch (err) {
      if (err?.status >= 500) {
        setError('Something went wrong. Please try again later.');
      } else {
        // Anti-enumeration: treat non-500 errors as successful submission
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBackToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleResetSubmitted = useCallback(() => {
    setSubmitted(false);
    setSubmittedIdentifier('');
    setError('');
  }, []);

  return (
    <ForgotPasswordScreen
      onSubmit={handleSubmit}
      onBackToLogin={handleBackToLogin}
      isLoading={loading}
      isSubmitted={submitted}
      submittedIdentifier={submittedIdentifier}
      errorMessage={error}
      onResetSubmitted={handleResetSubmitted}
    />
  );
}
