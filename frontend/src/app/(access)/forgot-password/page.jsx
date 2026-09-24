'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { passwordAPI } from '@/shared/api/client';
import { ForgotPasswordScreen } from '@/features/auth';

function normalizeIdentifier(value) {
  const trimmed = value.trim();
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  if (/^[\d\s\-+()]+$/.test(trimmed) && /\d/.test(trimmed))
    return trimmed.replace(/[^0-9+]/g, '');
  return trimmed;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedIdentifier, setSubmittedIdentifier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async ({ identifier }) => {
    const normalizedId = normalizeIdentifier(identifier);
    setError('');
    setLoading(true);
    setSubmittedIdentifier(normalizedId);

    try {
      await passwordAPI.forgot(normalizedId);
      setSubmittedIdentifier(identifier);
      setSubmitted(true);
    } catch (err) {
      if (err?.status >= 500) {
        setError('Something went wrong. Please try again later.');
      } else {
        // Anti-enumeration: treat non-500 errors as successful submission
        setSubmittedIdentifier(identifier);
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBackToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  // Lets the user start over with a different identifier from the confirmation view.
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

