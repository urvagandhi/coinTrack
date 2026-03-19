// src/app/(main)/brokers/_shared/BrokerCard.jsx
'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { itemVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import Link from 'next/link';

function relativeTime(iso) {
    if (!iso) return null;
    const d = Date.now() - new Date(iso).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ isConnected, isExpiringSoon, isExpired, isLoading }) {
    if (isLoading) return <Skeleton className="h-5 w-16 rounded-full" />;

    if (isConnected && !isExpiringSoon) {
        return <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">Connected</span>;
    }
    if (isExpiringSoon) {
        return <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">Expiring soon</span>;
    }
    if (isExpired) {
        return <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700">Token expired</span>;
    }
    return <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-accent text-muted-foreground">Not connected</span>;
}

export function BrokerCard({ broker }) {
    const { data, isLoading } = useBrokerConnection();
    const item = useMotionVariants(itemVariants);

    const brokerStatus = data?.brokers?.find((b) => b.broker === broker.key);
    const isConnected = brokerStatus?.tokenActive ?? false;
    const isExpiringSoon = brokerStatus?.isExpiringSoon ?? false;
    const isExpired = brokerStatus && !brokerStatus.tokenActive && brokerStatus.lastStatus !== null;
    const lastSyncedAt = brokerStatus?.lastSuccessAt;

    const buttonLabel = isExpired ? 'Reconnect' : isConnected ? 'Manage' : 'Connect';
    const buttonClass = isExpired
        ? 'bg-red-50 text-red-700 border border-red-200'
        : isConnected
            ? 'border border-border text-muted-foreground hover:bg-accent'
            : 'bg-blue-600 text-white hover:bg-blue-700';

    return (
        <motion.div
            variants={item}
            className={cn('bg-card border border-border rounded-xl p-6 border-l-4', broker.accentClass)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0', broker.badgeClass)}>
                        {broker.initials}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{broker.displayName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{broker.tagline}</p>
                    </div>
                </div>
                <StatusBadge isConnected={isConnected} isExpiringSoon={isExpiringSoon} isExpired={isExpired} isLoading={isLoading} />
            </div>

            <ul className="space-y-1.5 mb-5">
                {broker.capabilities.map((cap) => (
                    <li key={cap} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check size={11} className="text-green-600 flex-shrink-0" />
                        {cap}
                    </li>
                ))}
            </ul>

            {isConnected && lastSyncedAt && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-4">
                    <Clock size={10} />
                    Last synced {relativeTime(lastSyncedAt)}
                </p>
            )}

            <Link href={broker.setupPath}>
                <button className={cn('w-full h-8 px-4 rounded-lg text-xs font-medium transition-colors', buttonClass)}>
                    {buttonLabel}
                </button>
            </Link>
        </motion.div>
    );
}
