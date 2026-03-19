'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { shouldReduceMotion } from '@/lib/motion';

/**
 * Base skeleton component with Framer Motion pulse.
 * Respects prefers-reduced-motion.
 */
export function Skeleton({ className, ...props }) {
    const reduceMotion = shouldReduceMotion();

    return (
        <motion.div
            className={cn('rounded bg-accent', className)}
            animate={reduceMotion ? {} : { opacity: [1, 0.4, 1] }}
            transition={reduceMotion ? {} : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            {...props}
        />
    );
}

/**
 * Text skeleton — renders N lines with varying widths.
 */
export function SkeletonText({ lines = 1, className }) {
    const widths = ['100%', '80%', '60%', '90%', '70%'];

    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-4"
                    style={{ width: widths[i % widths.length] }}
                />
            ))}
        </div>
    );
}

/**
 * Card skeleton — matches typical card layout (header + body lines).
 */
export function SkeletonCard({ className }) {
    return (
        <div className={cn('rounded-lg border border-border bg-card p-6 space-y-4', className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-8 w-32" />
            <SkeletonText lines={2} />
        </div>
    );
}

/**
 * Stat card skeleton — matches the shape of StatsCard on dashboard.
 */
export function SkeletonStat({ className }) {
    return (
        <div className={cn('rounded-lg border border-border bg-card p-5 space-y-3', className)}>
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
        </div>
    );
}

/**
 * Table row skeleton — a row with N column placeholders.
 */
export function SkeletonTableRow({ columns = 5 }) {
    const widths = ['w-24', 'w-16', 'w-20', 'w-14', 'w-18'];

    return (
        <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="py-3 px-4">
                    <Skeleton className={cn('h-4', widths[i % widths.length])} />
                </td>
            ))}
        </tr>
    );
}
