'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/setup-2fa',
    '/reset-2fa',
];

const AUTH_ONLY_ROUTES = ['/login', '/register'];
const CALCULATOR_PREFIX = '/calculators';

export default function AuthGuard({ children }) {
    const { isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isPublic =
        PUBLIC_ROUTES.includes(pathname) ||
        pathname.startsWith(CALCULATOR_PREFIX);

    useEffect(() => {
        if (isInitializing) return;

        if (!isAuthenticated && !isPublic) {
            // Preserve full URL including query params (critical for OAuth callbacks like Zerodha)
            const qs = typeof window !== 'undefined' ? window.location.search : '';
            const fullPath = qs ? `${pathname}${qs}` : pathname;
            router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
            return;
        }

        if (isAuthenticated && AUTH_ONLY_ROUTES.includes(pathname)) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isInitializing, isPublic, pathname, router]);

    if (isInitializing) {
        return (
            <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-3">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600"
                />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (!isAuthenticated && !isPublic) {
        return null;
    }

    return children;
}
