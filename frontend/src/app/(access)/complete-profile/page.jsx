'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterScreen } from '@/components/ui/auth/register-screen';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { completeGoogleProfile } = useAuth();

  const [tempToken, setTempToken] = useState('');
  const [initialData, setInitialData] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('tempToken');
    const tempEmail = sessionStorage.getItem('tempEmail') || '';
    const tempName = sessionStorage.getItem('tempName') || '';

    if (!token) {
      router.replace('/login');
    } else {
      setTempToken(token);

      const autoUsername = tempEmail
        ? tempEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
        : '';

      setInitialData({
        email: tempEmail,
        name: tempName,
        username: autoUsername,
      });
    }
  }, [router]);

  const handleRegister = useCallback(
    async formData => {
      setError('');
      setIsLoading(true);

      try {
        const payload = {
          tempToken,
          username: formData.username,
          phoneNumber: `+91${formData.mobile.replace(/[^0-9]/g, '').slice(-10)}`,
          password: formData.password,
          confirmPassword: formData.password, // RegisterScreen already validates match
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
        };

        const result = await completeGoogleProfile(payload);

        if (result.success) {
          if (result.requireTotpSetup) {
            sessionStorage.removeItem('tempEmail');
            sessionStorage.removeItem('tempToken');
            sessionStorage.setItem('totpSetupToken', result.tempToken);
            sessionStorage.setItem('totpSetupUsername', formData.username);
            router.push('/setup-2fa');
          } else {
            sessionStorage.removeItem('tempToken');
            sessionStorage.removeItem('tempEmail');
            router.push('/dashboard');
          }
        } else {
          setError(
            result.error || 'Failed to complete profile. Please try again.'
          );
        }
      } catch (err) {
        setError(
          err.message || err.userMessage || 'An unexpected error occurred'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [tempToken, completeGoogleProfile, router]
  );

  if (!tempToken) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin' />
      </div>
    );
  }

  return (
    <RegisterScreen
      mode='complete-profile'
      initialData={initialData}
      onRegister={handleRegister}
      isLoading={isLoading}
      errorMessage={error}
    />
  );
}
