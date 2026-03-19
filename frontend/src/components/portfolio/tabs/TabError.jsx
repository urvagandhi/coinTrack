// src/components/portfolio/tabs/TabError.jsx
'use client';

import { AlertCircle } from 'lucide-react';

export function TabError({ error, onRetry }) {
    return (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={18} className="text-red-600" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">Failed to load data</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {error?.message || 'Something went wrong. Please try again.'}
                </p>
            </div>
            {onRetry && (
                <button onClick={onRetry} className="h-8 px-4 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Try again
                </button>
            )}
        </div>
    );
}
