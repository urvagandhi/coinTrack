'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { passwordAPI } from '@/lib/api';
import { ResetPasswordScreen } from '@/components/ui/auth/reset-password-screen';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
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

  const handleSubmit = useCallback(
    async ({ password }) => {
      setError('');
      if (!tempToken) return;

      try {
        await passwordAPI.reset(tempToken, password);
        setStep('success');
      } catch (err) {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    },
    [tempToken]
  );

  const handleBackToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  return (
    <ResetPasswordScreen
      isTokenValid={step !== 'error'}
      onSubmit={step === 'form' ? handleSubmit : undefined}
      onBackToLogin={handleBackToLogin}
      isLoading={step === 'verifying'}
      errorMessage={step === 'form' ? error : message || undefined}
    />
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
