'use client';

import TotpSetup from '@/components/TotpSetup';
import { tokenManager, totpAPI } from '@/lib/api';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function Setup2FAPageContent() {
    const router = useRouter();
    const [isRegistration, setIsRegistration] = useState(false);
    const [tempToken, setTempToken] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if this is a REGISTRATION flow (new user - not in DB yet)
        const registrationToken = sessionStorage.getItem('totpSetupToken');

        // Check if this is an EXISTING user flow (TOTP_SETUP purpose)
        const existingUserToken = sessionStorage.getItem('tempToken');

        if (registrationToken) {
            // REGISTRATION flow - user is new, not in DB yet
            setTempToken(registrationToken);
            setIsRegistration(true);
            setLoading(false);
        } else if (existingUserToken) {
            // EXISTING user mandatory TOTP setup (logged in but hasn't set up 2FA yet)
            tokenManager.setToken(existingUserToken);
            setIsRegistration(false);
            setLoading(false);
        } else {
            // No token - shouldn't be here, redirect to login
            router.push('/login');
        }
    }, [router]);

    // Registration-specific setup action
    const registrationSetup = async () => {
        try {
            const data = await totpAPI.registerSetup(tempToken);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Setup failed' };
        }
    };

    // Registration-specific verify action
    const registrationVerify = async (code) => {
        try {
            const data = await totpAPI.registerVerify(tempToken, code);
            // On success, data contains JWT token and backup codes
            if (data.token) {
                setAuthToken(data.token);
                tokenManager.setToken(data.token);
            }
            return { success: true, backupCodes: data.backupCodes || [] };
        } catch (error) {
            return { success: false, error: error.message || 'Verification failed' };
        }
    };

    const handleComplete = () => {
        if (isRegistration) {
            // Clear registration tokens
            sessionStorage.removeItem('totpSetupToken');
            sessionStorage.removeItem('totpSetupUsername');
            // JWT token is already set by registrationVerify
            router.push('/dashboard');
        } else {
            // Existing user mandatory setup - session token was temp, needs re-login
            sessionStorage.removeItem('tempToken');
            tokenManager.removeToken();
            router.push('/login?message=Setup%20Complete%20Please%20Login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader className="animate-spin w-8 h-8 text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6 flex items-center justify-center">
            <TotpSetup
                isMandatory={true}
                onComplete={handleComplete}
                onCancel={() => router.push('/login')}
                setupAction={isRegistration ? registrationSetup : undefined}
                verifyAction={isRegistration ? registrationVerify : undefined}
            />
        </div>
    );
}

export default function Setup2FAPage() {
    return (
        <Suspense fallback={<Loader />}>
            <Setup2FAPageContent />
        </Suspense>
    );
}
