'use client';

import TotpSetup from '@/components/TotpSetup';
import { useAuth } from '@/contexts/AuthContext';
import { tokenManager } from '@/lib/api';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function Setup2FAPageContent() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isMandatory, setIsMandatory] = useState(false);

    useEffect(() => {
        // Check if we have a mandatory setup token in sessionStorage
        const tempToken = sessionStorage.getItem('tempToken');
        if (tempToken) {
            // Logic to support mandatory setup using this token.
            // Since AuthContext APIs usually use the token from TokenManager/State,
            // we might need to swap the token temporarily or explicit logic.
            // But for simplicity, we rely on the interceptor catching this if we set it,
            // OR we must ensure TotpSetup passes it to the API.
            // Ideally Api.js uses tokenManager.getToken().
            // So we set it here.
            tokenManager.setToken(tempToken);
            setIsMandatory(true);
        }
    }, []);

    const handleComplete = () => {
        if (isMandatory) {
            // Clear temp token, but effectively since setup is done,
            // we probably need to Re-Login to get full access token (as pending secret promotion happened,
            // but the original token was TOTP_SETUP purpose).
            // A promoted secret doesn't automatically upgrade the token purpose.
            // User needs to login again to get TOTP_LOGIN -> Verify -> Access Token.
            sessionStorage.removeItem('tempToken');
            tokenManager.removeToken();
            router.push('/login?message=Setup%20Complete%20Please%20Login');
        } else {
            router.push('/settings');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    // Protection: If not mandatory and not logged in, redirect
    if (!isMandatory && !user) {
        // router.push('/login'); // Commented out to prevent flash if user loading is slow, waiting for effect
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6 flex items-center justify-center">
            <TotpSetup
                isMandatory={isMandatory}
                onComplete={handleComplete}
                onCancel={() => router.back()}
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
