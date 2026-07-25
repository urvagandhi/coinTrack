'use client';

import { useState } from 'react';
import { Info, AlertTriangle, X, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';

export function formatRelativeTime(dateString) {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    if (isNaN(diffMs) || diffMs < 0) return 'recently';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function RateDisclosureBanner({ goldSnapshot, silverSnapshot, onOpenSettings, className }) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    const isStale = goldSnapshot?.isStale || silverSnapshot?.isStale;
    const premiumPercent = goldSnapshot?.localPremiumPercent || silverSnapshot?.localPremiumPercent || 15;
    const fetchedAt = goldSnapshot?.fetchedAt || silverSnapshot?.fetchedAt;
    const relativeTime = formatRelativeTime(fetchedAt);

    return (
        <div
            className={cn(
                "p-3 rounded-sm border text-[12px] font-mono flex items-center justify-between gap-3 transition-colors",
                isStale
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
                className
            )}
        >
            <div className="flex items-center gap-2 flex-wrap">
                {isStale ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                )}

                <span>
                    {isStale ? (
                        <>Rate may be outdated — GoldAPI unreachable, showing last known price.</>
                    ) : (
                        <>
                            Live rates powered by <strong>GoldAPI.io</strong> — global spot price + local duty/premium (currently <strong>+{premiumPercent}%</strong>) to approximate Indian retail rates. Actual jeweller quotes may vary.
                        </>
                    )}
                    <span className="opacity-80 ml-1.5 font-normal">
                        Rate last updated: <strong>{relativeTime}</strong>.
                    </span>
                </span>

                {onOpenSettings && (
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity ml-1"
                    >
                        <Sliders className="h-3 w-3" />
                        <span>Adjust Rate / Premium</span>
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded-xs shrink-0"
                title="Dismiss notice"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
