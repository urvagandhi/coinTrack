'use client';

import { ResetPasswordScreen } from '@/features/auth';
import { passwordAPI } from '@/shared/api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState('verifying');
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const verificationStarted = useRef(false);

  const verifyToken = useCallback(async token => {
    try {
      const result = await passwordAPI.forgotVerify(token);
      setTempToken(result.tempToken);
      setStep('form');
    } catch (err) {
      setStep('error');
      setMessage(
        err.message ||
          'Reset link has expired. Please request a new password reset.'
      );
    }
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStep('error');
      setMessage('Invalid reset link. Please request a new password reset.');
      return;
    }
    if (verificationStarted.current) return;
    verificationStarted.current = true;
    verifyToken(token);
  }, [searchParams, verifyToken]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async ({ password }) => {
      setError('');
      if (!tempToken) return;

      setIsSubmitting(true);
      try {
        await passwordAPI.reset(tempToken, password);
        router.push(
          '/login?message=Password reset successful. You can now log in.'
        );
      } catch (err) {
        setError(
          err.message ||
            'Failed to reset password. Please check password requirements and try again.'
        );
        setIsSubmitting(false);
      }
    },
    [tempToken, router]
  );

  const handleBackToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  return (
    <ResetPasswordScreen
      isTokenValid={step !== 'error'}
      onSubmit={step === 'form' ? handleSubmit : undefined}
      onBackToLogin={handleBackToLogin}
      isLoading={step === 'verifying' || isSubmitting}
      errorMessage={step === 'form' ? error : message || undefined}
    />
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin' />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

