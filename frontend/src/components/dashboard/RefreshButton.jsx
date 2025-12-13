'use client';

import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
// Simple toast implementation or standard alert
// Assuming we don't have a toast library connected yet effectively, using console/alert fallback or minimal UI feedback

export default function RefreshButton() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const queryClient = useQueryClient();

    const handleRefresh = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        // Optimistic / Feedback
        // In a real app: toast.info("Syncing portfolio...");

        try {
            await api.post('/api/portfolio/refresh');

            // Wait a bit to ensure backend processing (simple delay/debounce)
            setTimeout(async () => {
                await Promise.all([
                    queryClient.invalidateQueries(['portfolio']),
                    queryClient.invalidateQueries(['netPositions'])
                ]);
                setIsRefreshing(false);
                // toast.success("Portfolio updated");
            }, 2000);
        } catch (e) {
            setIsRefreshing(false);
            // toast.error("Sync failed");
        }
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={clsx(
                "flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                isRefreshing && "animate-pulse"
            )}
            aria-label="Refresh Portfolio"
        >
            <RefreshCw className={clsx("h-4 w-4", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
        </button>
    );
}
