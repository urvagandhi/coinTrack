'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const publicRoutes = ['/login', '/register', '/forgot-password', '/', '/calculator'];

export default function AuthGuard({ children }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip auth check while loading
        if (isLoading) return;

        const isPublicRoute = publicRoutes.some(route =>
            pathname === route || pathname.startsWith(route + '/')
        );

        // If user is not authenticated and trying to access protected route
        if (!isAuthenticated && !isPublicRoute) {
            router.push('/login');
            return;
        }

        // If user is authenticated and trying to access auth pages, redirect to dashboard
        if (isAuthenticated && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
            router.push('/dashboard');
            return;
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cointrack-primary/10 to-cointrack-secondary/10">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cointrack-primary"></div>
                    <p className="text-cointrack-dark/60 dark:text-cointrack-light/60">Loading...</p>
                </div>
            </div>
        );
    }

    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // If trying to access protected route without authentication, don't render children
    if (!isAuthenticated && !isPublicRoute) {
        return null;
    }

    return children;
}
