'use client';

import { TwoFactorSetupScreen } from '@/features/auth';
import { tokenManager, totpAPI } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function Setup2FAContent() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isRegistration, setIsRegistration] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secretKey, setSecretKey] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const registrationToken =
      sessionStorage.getItem('totpSetupToken') ||
      sessionStorage.getItem('registrationTempToken');
    const existingUserToken = sessionStorage.getItem('tempToken');

    if (registrationToken) {
      if (tokenManager.isTokenExpired(registrationToken)) {
        sessionStorage.removeItem('totpSetupToken');
        sessionStorage.removeItem('registrationTempToken');
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
      setTempToken(existingUserToken);
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
      const data = isRegistration
        ? await totpAPI.registerSetup(tempToken)
        : await totpAPI.setup(tempToken);

      const resolvedData = data?.data || data || {};
      const rawSecret =
        resolvedData.secret ||
        resolvedData.secretKey ||
        resolvedData.secret_key ||
        resolvedData.totpSecret ||
        '';

      const rawQr =
        resolvedData.qrCodeUri ||
        resolvedData.qrUri ||
        resolvedData.qr_code_uri ||
        resolvedData.qrCodeBase64 ||
        '';

      const secretFromQr =
        rawQr && typeof rawQr === 'string'
          ? rawQr.match(/[?&]secret=([A-Za-z0-9]+)/i)?.[1] || ''
          : '';

      const finalSecret = rawSecret || secretFromQr;

      setSecretKey(finalSecret);
      setQrUri(rawQr);
    } catch (error) {
      const msg = error.message || '';
      if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('unauthorized')
      ) {
        if (isRegistration) {
          sessionStorage.removeItem('totpSetupToken');
          sessionStorage.removeItem('totpSetupUsername');
          router.push(
            '/register?error=Registration expired. Please register again.'
          );
        } else {
          sessionStorage.removeItem('tempToken');
          router.push('/login?error=Session expired. Please login again.');
        }
      }
    }
  }, [tempToken, qrUri, isRegistration, router]);

  // Fetch QR code and secret from backend
  useEffect(() => {
    fetchSetup();
  }, [fetchSetup]);

  const handleVerify = useCallback(
    async code => {
      setIsVerifying(true);
      try {
        const data = isRegistration
          ? await totpAPI.registerVerify(tempToken, code)
          : await totpAPI.verify(code, tempToken);

        if (data.token) {
          tokenManager.setToken(data.token, true);
          if (data.refreshToken) {
            tokenManager.setRefreshToken(data.refreshToken);
          }
          if (refreshUser) {
            await refreshUser().catch(() => {});
          }
        }
        setBackupCodes(data.backupCodes || []);
        return { success: true, backupCodes: data.backupCodes || [] };
      } catch (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('expired')) {
          if (isRegistration) {
            sessionStorage.removeItem('totpSetupToken');
            sessionStorage.removeItem('totpSetupUsername');
            router.push(
              '/register?error=Registration expired. Please register again.'
            );
          } else {
            sessionStorage.removeItem('tempToken');
            router.push('/login?error=Session expired. Please login again.');
          }
        }
        return { success: false, error: msg || 'Verification failed' };
      } finally {
        setIsVerifying(false);
      }
    },
    [tempToken, isRegistration, refreshUser, router]
  );

  const handleComplete = useCallback(() => {
    sessionStorage.removeItem('totpSetupToken');
    sessionStorage.removeItem('totpSetupUsername');
    sessionStorage.removeItem('tempToken');

    if (tokenManager.getToken()) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login?message=Setup%20Complete%20Please%20Login';
    }
  }, []);

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
