'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function StatsCard({
    label,
    value,
    changePercent,
    isPositive,
    accentColor = 'muted',
    icon: Icon,
    isLoading = false,
    index,
    children,
}) {
    if (children && !label) {
        return (
            <div className="ed-card p-5">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                {children}
            </div>
        );
    }

    const accentClass =
        accentColor === 'success' ? 'text-[hsl(var(--gain))]'
        : accentColor === 'danger' ? 'text-[hsl(var(--loss))]'
        : 'text-foreground';

    return (
        <div className="ed-card relative px-5 py-5 group transition-colors hover:border-hairline">
            <span className="corner-mark corner-tl" />
            <span className="corner-mark corner-br" />

            <div className="flex items-start justify-between mb-4">
                <div className="flex items-baseline gap-2">
                    {index != null && (
                        <span className="index-num tnum">[{String(index).padStart(2, '0')}]</span>
                    )}
                    <p className="eyebrow">{label}</p>
                </div>
                {Icon && (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" strokeWidth={1.5} />
                )}
            </div>

            <div>
                {isLoading ? (
                    <Skeleton className="h-9 w-32 rounded-sm" />
                ) : (
                    <p className={cn(
                        'hero-amount text-[28px] md:text-[30px]',
                        accentClass,
                    )}>
                        {value ?? '—'}
                    </p>
                )}
            </div>

            {!isLoading && changePercent != null && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="eyebrow">Delta</span>
                    <span
                        className={cn(
                            'flex items-center gap-1 font-mono tnum text-xs font-medium',
                            isPositive ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]',
                        )}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                        ) : (
                            <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
                        )}
                        {changePercent}
                    </span>
                </div>
            )}
        </div>
    );
}
