'use client';

import { AlertCircle } from 'lucide-react';

export function TabError({ error, onRetry }) {
    return (
        <div className="ed-card relative px-8 py-14 text-center">
            <span className="corner-mark corner-tl" />
            <span className="corner-mark corner-tr" />
            <span className="corner-mark corner-bl" />
            <span className="corner-mark corner-br" />
            <div className="max-w-sm mx-auto">
                <AlertCircle className="h-6 w-6 text-[hsl(var(--loss))] mx-auto mb-4" strokeWidth={1.5} />
                <p className="font-serif italic text-[22px] text-foreground mb-1">An error has been recorded.</p>
                <p className="text-[12px] text-muted-foreground mb-5">
                    {error?.message || 'Something went wrong while fetching this section.'}
                </p>
                {onRetry && (
                    <button onClick={onRetry} className="ed-btn ed-btn-primary">
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}
