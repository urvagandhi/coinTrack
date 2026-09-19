'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterScreen } from '@/components/ui/auth/register-screen';

function RegisterPageContent() {
  const router = useRouter();
  const { register, completeGoogleProfile } = useAuth();

  const [tempToken, setTempToken] = useState('');
  const [initialData, setInitialData] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Determine if this is a complete-profile flow (from Google OAuth)
  useEffect(() => {
    const token = sessionStorage.getItem('tempToken');
    const tempEmail = sessionStorage.getItem('tempEmail') || '';
    const tempName = sessionStorage.getItem('tempName') || '';

    if (!token) {
      // Normal registration flow
      setTempToken('');
      setInitialData({});
    } else {
      // Complete-profile flow (Google OAuth)
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
  }, []);

  const mode = tempToken ? 'complete-profile' : 'register';

  const handleRegister = useCallback(
    async formData => {
      setError('');
      setIsLoading(true);

      try {
        if (mode === 'register') {
          const registerPayload = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            mobile: formData.mobile.replace(/[^0-9]/g, '').slice(-10),
            firstName: formData.name.split(' ')[0],
            lastName: formData.name.split(' ').slice(1).join(' ') || '',
          };

          const result = await register(registerPayload);
          const data = result.data || result;

          if (data.requireTotpSetup && data.tempToken) {
            sessionStorage.setItem('totpSetupToken', data.tempToken);
            sessionStorage.setItem('totpSetupUsername', data.username);
            router.push('/setup-2fa');
            return;
          }

          setError(
            'Registration completed but TOTP setup was not triggered. Please contact support.'
          );
        } else {
          // complete-profile flow (Google OAuth)
          const payload = {
            tempToken,
            username: formData.username,
            phoneNumber: `+91${formData.mobile.replace(/[^0-9]/g, '').slice(-10)}`,
            password: formData.password,
            confirmPassword: formData.password,
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
        }
      } catch (err) {
        setError(
          err.message || err.userMessage || 'An unexpected error occurred'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [tempToken, mode, register, completeGoogleProfile, router]
  );

  const handleGoogleSignUp = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID is not configured.');
      return;
    }

    setError('');
    const redirectUri = `${
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    }/login`;
    window.location.assign(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${encodeURIComponent('email profile')}`
    );
  }, []);

  if (!tempToken && mode === 'complete-profile') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin' />
      </div>
    );
  }

  return (
    <RegisterScreen
      mode={mode}
      initialData={initialData}
      tempToken={tempToken}
      onRegister={handleRegister}
      onGoogleSignUp={handleGoogleSignUp}
      isLoading={isLoading}
      errorMessage={error}
      onLoginRedirect={() => router.push('/login')}
    />
  );
}

export default function RegisterPage() {
  return <RegisterPageContent />;
}
