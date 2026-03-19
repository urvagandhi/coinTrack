// src/components/portfolio/tabs/TabLoadingSkeleton.jsx
'use client';

import { Skeleton, SkeletonTableRow } from '@/components/ui/Skeleton';

export function TabLoadingSkeleton({ rows = 8, columns = 6 }) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-4">
                <table className="w-full">
                    <tbody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <SkeletonTableRow key={i} columns={columns} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
