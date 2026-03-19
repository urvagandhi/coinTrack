// src/app/(access)/setup-2fa/page.jsx
'use client';

import { AuthPageShell } from '@/components/auth/AuthPageShell';
import TotpSetup from '@/components/TotpSetup';
import { tokenManager, totpAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function Setup2FAContent() {
    const router = useRouter();
    const [isRegistration, setIsRegistration] = useState(false);
    const [tempToken, setTempToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const registrationToken = sessionStorage.getItem('totpSetupToken');
        const existingUserToken = sessionStorage.getItem('tempToken');

        if (registrationToken) {
            setTempToken(registrationToken);
            setIsRegistration(true);
            setLoading(false);
        } else if (existingUserToken) {
            tokenManager.setToken(existingUserToken);
            setIsRegistration(false);
            setLoading(false);
        } else {
            router.push('/login');
        }
    }, [router]);

    const registrationSetup = async () => {
        try {
            const data = await totpAPI.registerSetup(tempToken);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Setup failed' };
        }
    };

    const registrationVerify = async (code) => {
        try {
            const data = await totpAPI.registerVerify(tempToken, code);
            if (data.token) {
                tokenManager.setToken(data.token);
                if (data.refreshToken) tokenManager.setRefreshToken(data.refreshToken);
            }
            return { success: true, backupCodes: data.backupCodes || [] };
        } catch (error) {
            return { success: false, error: error.message || 'Verification failed' };
        }
    };

    const handleComplete = () => {
        if (isRegistration) {
            sessionStorage.removeItem('totpSetupToken');
            sessionStorage.removeItem('totpSetupUsername');
            router.push('/dashboard');
        } else {
            sessionStorage.removeItem('tempToken');
            tokenManager.removeToken();
            router.push('/login?message=Setup%20Complete%20Please%20Login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <AuthPageShell
            title="Secure your account"
            subtitle="Two-factor authentication is required for all CoinTrack accounts"
            maxWidth="md"
        >
            <TotpSetup
                isMandatory
                onComplete={handleComplete}
                onCancel={() => router.push('/login')}
                setupAction={isRegistration ? registrationSetup : undefined}
                verifyAction={isRegistration ? registrationVerify : undefined}
            />
        </AuthPageShell>
    );
}

export default function Setup2FAPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
        }>
            <Setup2FAContent />
        </Suspense>
    );
}
