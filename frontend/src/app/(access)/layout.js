// src/app/(access)/layout.js
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccessLayout({ children }) {
    const { isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isInitializing && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isInitializing, router]);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-muted dark:bg-background">
            {children}
        </div>
    );
}
