'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Clock } from 'lucide-react';
import Link from 'next/link';

function relativeTime(iso) {
    if (!iso) return null;
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const BROKER_ACCENT_VAR = {
    ZERODHA:   '--broker-zerodha',
    ANGEL_ONE: '--broker-angel',
    UPSTOX:    '--broker-upstox',
};

function StatusPill({ isConnected, isExpiringSoon, isExpired, isLoading }) {
    if (isLoading) return <Skeleton className="h-5 w-20 rounded-sm" />;
    if (isExpired) return <span className="ed-pill ed-pill-loss">Expired</span>;
    if (isExpiringSoon) return <span className="ed-pill ed-pill-warn">Expiring</span>;
    if (isConnected) return <span className="ed-pill ed-pill-gain"><span className="live-dot" />Live</span>;
    return <span className="ed-pill">Not connected</span>;
}

export function BrokerCard({ broker, index = 0 }) {
    const { data, isLoading } = useBrokerConnection();
    const status = data?.brokers?.find((b) => b.broker === broker.key);
    const isConnected = status?.tokenActive ?? false;
    const isExpiringSoon = status?.isExpiringSoon ?? false;
    const isExpired = status && !status.tokenActive && status.lastStatus !== null;
    const lastSyncedAt = status?.lastSuccessAt;
    const ctaLabel = isExpired ? 'Reconnect' : isConnected ? 'Manage' : 'Connect';

    const accentVar = BROKER_ACCENT_VAR[broker.key] || '--accent';
    const accentColor = `hsl(var(${accentVar}))`;

    return (
        <article
            className="ed-card relative group transition-transform"
            style={{ borderTopWidth: '3px', borderTopColor: accentColor }}
        >
            <span className="corner-mark corner-bl" />
            <span className="corner-mark corner-br" />

            <div className="p-6">
                {/* Eyebrow row */}
                <div className="flex items-baseline justify-between mb-5">
                    <span className="index-num tnum">№ {String(index + 1).padStart(2, '0')} — Vendor</span>
                    <StatusPill
                        isConnected={isConnected}
                        isExpiringSoon={isExpiringSoon}
                        isExpired={isExpired}
                        isLoading={isLoading}
                    />
                </div>

                {/* Identity */}
                <div className="flex items-start gap-4 mb-5">
                    <div
                        className="h-14 w-14 flex items-center justify-center rounded-sm font-mono font-bold text-[15px] tracking-wider flex-shrink-0"
                        style={{
                            color: accentColor,
                            background: `hsl(var(${accentVar}) / 0.08)`,
                            border: `1px solid hsl(var(${accentVar}) / 0.35)`,
                        }}
                    >
                        {broker.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-[26px] text-foreground leading-tight tracking-tight">{broker.displayName}</h3>
                        <p className="text-[12px] text-muted-foreground mt-1 font-serif italic">{broker.tagline}</p>
                    </div>
                </div>

                {/* Capabilities */}
                <div className="mb-5 pt-5 border-t border-border">
                    <p className="eyebrow mb-3">Capabilities</p>
                    <ul className="grid grid-cols-2 gap-y-1.5 gap-x-3">
                        {broker.capabilities.map((cap) => (
                            <li key={cap} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Check className="h-3 w-3 text-[hsl(var(--gain))] flex-shrink-0" strokeWidth={2.5} />
                                {cap}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 pt-5 border-t border-hairline">
                    {isConnected && lastSyncedAt ? (
                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <Clock className="h-2.5 w-2.5" />
                            {relativeTime(lastSyncedAt)}
                        </span>
                    ) : (
                        <span className="text-[10px] text-muted-foreground/60 font-mono">—</span>
                    )}

                    <Link
                        href={broker.setupPath}
                        className={cn(
                            'ed-btn',
                            isConnected ? 'ed-btn-ghost' : isExpired ? 'ed-btn-accent' : 'ed-btn-primary'
                        )}
                    >
                        {ctaLabel}
                        <ArrowRight className="h-3 w-3" strokeWidth={2} />
                    </Link>
                </div>
            </div>
        </article>
    );
}
