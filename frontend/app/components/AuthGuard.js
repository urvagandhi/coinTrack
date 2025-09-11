'use client';

import { useAuth } from '@/app/contexts/AuthContext';

export default function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    );
}

export function AuthGuard({ children }) {
    const { loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return children;
}
