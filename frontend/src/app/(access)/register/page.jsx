'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/shared/auth/AuthContext';
import { RegisterScreen } from '@/features/auth';

function normalizeIdentifier(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  if (/^[\d\s\-+()]+$/.test(trimmed) && /\d/.test(trimmed))
    return trimmed.replace(/[^0-9+]/g, '');
  return trimmed;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, googleLogin, completeGoogleProfile } = useAuth();

  const [tempToken, setTempToken] = useState('');
  const [initialData, setInitialData] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleState, setGoogleState] = useState('idle');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const hasAttemptedGoogleLogin = useRef(false);

  // Initialize from sessionStorage if redirected from /login profile completion flow
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = sessionStorage.getItem('tempToken');
    const tempEmail = sessionStorage.getItem('tempEmail') || '';
    const tempName = sessionStorage.getItem('tempName') || '';

    if (token) {
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

  const handleGoogleRedirect = useCallback(
    async code => {
      setIsGoogleLoading(true);
      setGoogleState('signing-in');
      setError('');

      const redirectUri = `${
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      }/login`;

      try {
        const result = await googleLogin(code, redirectUri);

        if (result.requiresProfileCompletion) {
          sessionStorage.setItem('tempToken', result.tempToken);
          if (result.email) sessionStorage.setItem('tempEmail', result.email);
          if (result.name) sessionStorage.setItem('tempName', result.name);

          setTempToken(result.tempToken);
          const tempEmail = result.email || '';
          const tempName = result.name || '';
          const autoUsername = tempEmail
            ? tempEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
            : '';

          setInitialData({
            email: tempEmail,
            name: tempName,
            username: autoUsername,
          });
          setGoogleState('idle');
          setIsGoogleLoading(false);
          router.replace('/register');
        } else if (result.requiresTotp) {
          router.push('/login');
        } else if (result.success) {
          router.push('/dashboard');
        } else {
          setGoogleState('idle');
          setIsGoogleLoading(false);
          router.replace('/register');
          setError(result.error || 'Google sign-up failed.');
        }
      } catch {
        setGoogleState('idle');
        setIsGoogleLoading(false);
        router.replace('/register');
        setError('Google sign-up failed. Please try again.');
      }
    },
    [googleLogin, router]
  );

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !hasAttemptedGoogleLogin.current) {
      hasAttemptedGoogleLogin.current = true;
      handleGoogleRedirect(code);
    }
  }, [searchParams, handleGoogleRedirect]);

  const mode = tempToken ? 'complete-profile' : 'register';

  const handleClearPrefill = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('tempEmail');
      sessionStorage.removeItem('tempName');
    }
    setTempToken('');
    setInitialData({});
    setError('');
  }, []);

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
            mobile: normalizeIdentifier(formData.phoneNumber),
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
            phoneNumber: normalizeIdentifier(formData.phoneNumber),
            password: formData.password,
            confirmPassword: formData.password,
            name: formData.name,
            dateOfBirth: formData.dateOfBirth,
          };

          const result = await completeGoogleProfile(payload);

          if (result.success) {
            sessionStorage.removeItem('tempToken');
            sessionStorage.removeItem('tempEmail');
            sessionStorage.removeItem('tempName');

            if (result.requireTotpSetup) {
              sessionStorage.setItem('totpSetupToken', result.tempToken);
              sessionStorage.setItem('totpSetupUsername', formData.username);
              router.push('/setup-2fa');
            } else {
              router.push('/dashboard');
            }
          } else {
            let errMsg =
              result.error || 'Failed to complete profile. Please try again.';
            if (
              result.fieldErrors &&
              Array.isArray(result.fieldErrors) &&
              result.fieldErrors.length > 0
            ) {
              errMsg = result.fieldErrors
                .map(f => f.message || f.error || '')
                .filter(Boolean)
                .join('. ');
            }
            setError(errMsg);
          }
        }
      } catch (err) {
        let errMsg =
          err.message || err.userMessage || 'An unexpected error occurred';

        // If there are specific field validation errors from the backend, extract them
        if (
          err.fieldErrors &&
          Array.isArray(err.fieldErrors) &&
          err.fieldErrors.length > 0
        ) {
          // Join the messages. E.g. "Phone number is required"
          // This ensures the RegisterScreen's heuristic (which looks for words like "phone", "email") correctly places the error under the right input field.
          errMsg = err.fieldErrors
            .map(f => f.message || f.error || '')
            .filter(Boolean)
            .join('. ');
        }

        setError(errMsg);
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
    setGoogleState('connecting');
    setIsGoogleLoading(true);

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

  return (
    <RegisterScreen
      mode={mode}
      initialData={initialData}
      tempToken={tempToken}
      onRegister={handleRegister}
      onGoogleSignUp={handleGoogleSignUp}
      onClearPrefill={handleClearPrefill}
      isLoading={isLoading}
      isGoogleLoading={isGoogleLoading}
      googleState={googleState}
      errorMessage={error}
      onClearError={() => setError('')}
      onLoginRedirect={() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('tempToken');
          sessionStorage.removeItem('tempEmail');
          sessionStorage.removeItem('tempName');
        }
        router.push('/login');
      }}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin' />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}

