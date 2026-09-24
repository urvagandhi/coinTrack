'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { emailAPI, tokenManager } from '@/shared/api/client';
import { VerifyEmailScreen } from '@/features/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [isChange, setIsChange] = useState(false);
  const verificationStarted = useRef(false);
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  // /resend requires an authenticated session — only offer it if a live token exists
  const [canResend] = useState(() => {
    try {
      const token = tokenManager.getToken();
      return !!token && !tokenManager.isTokenExpired(token);
    } catch {
      return false;
    }
  });

  const handleResend = useCallback(async () => {
    setIsResending(true);
    try {
      const result = await emailAPI.resend();
      setResent(true);
      setMessage(
        result?.alreadyVerified
          ? 'This email is already verified — you can simply log in.'
          : 'A fresh verification link has been sent to your registered email address.'
      );
    } catch (err) {
      setMessage(
        err.message ||
          'Could not resend right now. Please log in and try again.'
      );
    } finally {
      setIsResending(false);
    }
  }, []);

  const handleContinue = useCallback(() => {
    window.location.href = '/dashboard';
  }, []);

  const handleBackToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const verifyEmail = useCallback(async (token, type) => {
    try {
      const result = await emailAPI.verify(token, type);
      if (result.alreadyVerified) {
        setStatus('already');
        setMessage(result.message || 'Your email has already been verified.');
      } else {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
      }
    } catch (err) {
      setStatus('error');
      setMessage(
        err.message || 'Email verification failed. The link may have expired.'
      );
    }
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token) {
      setStatus('error');
      setMessage(
        'Invalid verification link. Please check your email and try again.'
      );
      return;
    }
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    setIsChange(type === 'change');
    verifyEmail(token, type);
  }, [searchParams, verifyEmail]);

  return (
    <VerifyEmailScreen
      status={status}
      message={message}
      isChange={isChange}
      onContinue={handleContinue}
      onResend={canResend ? handleResend : undefined}
      onBackToLogin={handleBackToLogin}
      isResending={isResending}
      resent={resent}
      isLoggedIn={canResend}
    />
  );
}

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}

