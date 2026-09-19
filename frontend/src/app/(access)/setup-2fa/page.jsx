'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tokenManager, totpAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { TwoFactorSetupScreen } from '@/components/ui/auth/two-factor-setup-screen';
import { Suspense } from 'react';

function Setup2FAContent() {
  const router = useRouter();
  const [isRegistration, setIsRegistration] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secretKey, setSecretKey] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const registrationToken = sessionStorage.getItem('totpSetupToken');
    const existingUserToken = sessionStorage.getItem('tempToken');

    if (registrationToken) {
      if (tokenManager.isTokenExpired(registrationToken)) {
        sessionStorage.removeItem('totpSetupToken');
        sessionStorage.removeItem('totpSetupUsername');
        router.push(
          '/register?error=Registration expired. Please register again.'
        );
        return;
      }
      setTempToken(registrationToken);
      setIsRegistration(true);
      setLoading(false);
    } else if (existingUserToken) {
      if (tokenManager.isTokenExpired(existingUserToken)) {
        sessionStorage.removeItem('tempToken');
        router.push('/login?error=Session expired. Please login again.');
        return;
      }
      tokenManager.setToken(existingUserToken);
      setIsRegistration(false);
      setLoading(false);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchSetup = useCallback(async () => {
    if (!tempToken || qrUri) return;
    try {
      const data = await totpAPI.registerSetup(tempToken);
      setSecretKey(data.secretKey);
      setQrUri(data.qrUri);
    } catch (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('expired')) {
        sessionStorage.removeItem('totpSetupToken');
        sessionStorage.removeItem('totpSetupUsername');
        router.push(
          '/register?error=Registration expired. Please register again.'
        );
      }
    }
  }, [tempToken, qrUri, router]);

  // Fetch QR code and secret from backend
  useEffect(() => {
    fetchSetup();
  }, [fetchSetup]);

  const handleVerify = useCallback(
    async code => {
      setIsVerifying(true);
      try {
        const data = await totpAPI.registerVerify(tempToken, code);
        if (data.token) {
          tokenManager.setToken(data.token);
          if (data.refreshToken)
            tokenManager.setRefreshToken(data.refreshToken);
        }
        setBackupCodes(data.backupCodes || []);
        return { success: true, backupCodes: data.backupCodes || [] };
      } catch (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('expired')) {
          sessionStorage.removeItem('totpSetupToken');
          sessionStorage.removeItem('totpSetupUsername');
          router.push(
            '/register?error=Registration expired. Please register again.'
          );
        }
        return { success: false, error: msg || 'Verification failed' };
      } finally {
        setIsVerifying(false);
      }
    },
    [tempToken, router]
  );

  const handleComplete = useCallback(() => {
    if (isRegistration) {
      sessionStorage.removeItem('totpSetupToken');
      sessionStorage.removeItem('totpSetupUsername');
      router.push('/dashboard');
    } else {
      sessionStorage.removeItem('tempToken');
      tokenManager.removeToken();
      router.push('/login?message=Setup%20Complete%20Please%20Login');
    }
  }, [isRegistration, router]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Loader2 size={20} className='animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <TwoFactorSetupScreen
      userEmail={sessionStorage.getItem('totpSetupUsername') || 'Account'}
      secretKey={secretKey}
      qrUri={qrUri}
      onVerify={handleVerify}
      backupCodes={backupCodes.length > 0 ? backupCodes : undefined}
      isLoading={isVerifying}
      onComplete={handleComplete}
      onCancel={() => router.push('/login')}
    />
  );
}

export default function Setup2FAPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <Loader2 size={20} className='animate-spin text-muted-foreground' />
        </div>
      }
    >
      <Setup2FAContent />
    </Suspense>
  );
}
