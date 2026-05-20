'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI, portfolioAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    BarChart3,
    Check,
    Clock,
    ExternalLink,
    Globe,
    Link2,
    Mail,
    Minus,
    RefreshCw,
    Shield,
    User,
    Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const BROKER_META = {
    ZERODHA: {
        name: 'Zerodha', initials: 'ZE', slug: 'zerodha',
        accentVar: '--broker-zerodha',
        capabilities: ['Holdings', 'Positions', 'Funds', 'MF Holdings', 'MF SIPs', 'Orders'],
    },
    ANGEL_ONE: {
        name: 'Angel One', initials: 'AO', slug: 'angelone',
        accentVar: '--broker-angel',
        capabilities: ['Holdings', 'Positions', 'Funds', 'Orders', 'Trades'],
    },
    UPSTOX: {
        name: 'Upstox', initials: 'UP', slug: 'upstox',
        accentVar: '--broker-upstox',
        capabilities: ['Holdings', 'Positions', 'Funds', 'Orders'],
    },
};

function relativeTime(iso) {
    if (!iso) return null;
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function InfoRow({ icon: Icon, label, value }) {
    if (!value || value === '—') return null;
    return (
        <div className="flex items-start gap-3 py-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
                <p className="eyebrow mb-1">{label}</p>
                <p className="text-[12px] text-foreground font-mono break-all">{value}</p>
            </div>
        </div>
    );
}

function StatusPill({ broker }) {
    const isActive = broker.tokenActive;
    const needsReconnect = broker.needsReconnect;
    const isExpired = !isActive && broker.lastStatus !== null && broker.lastStatus !== 'NEVER_SYNCED';
    if (isActive && !needsReconnect) return <span className="ed-pill ed-pill-gain"><span className="live-dot" />Active</span>;
    if (needsReconnect) return <span className="ed-pill ed-pill-loss">Reconnect needed</span>;
    if (isExpired) return <span className="ed-pill ed-pill-loss">Expired</span>;
    return <span className="ed-pill">Not connected</span>;
}

function BrokerProfileCard({ broker, profileData, index }) {
    const meta = BROKER_META[broker.broker] || { name: broker.broker, initials: broker.broker?.slice(0, 2), capabilities: [], accentVar: '--muted-foreground' };
    const isActive = broker.tokenActive;
    const needsReconnect = !!broker.needsReconnect;
    const profile = broker.broker === 'ZERODHA' ? profileData : null;
    const accentColor = `hsl(var(${meta.accentVar}))`;
    const [reconnecting, setReconnecting] = useState(false);

    const handleReconnect = async () => {
        if (reconnecting || !meta.slug) return;
        setReconnecting(true);
        try {
            // Backend returns the broker's OAuth login URL — go straight there,
            // skipping the "save credentials" form since the keys are already on file.
            const res = await brokerAPI.getConnectUrl(meta.slug);
            const url = res?.loginUrl || res?.data?.loginUrl;
            if (url) {
                window.location.href = url;
            } else {
                window.location.href = '/brokers';
            }
        } catch (e) {
            window.location.href = '/brokers';
        } finally {
            setReconnecting(false);
        }
    };

    return (
        <article className="ed-card relative">
            <span className="corner-mark corner-tl" />
            <span className="corner-mark corner-tr" />
            <span className="corner-mark corner-bl" />
            <span className="corner-mark corner-br" />

            {/* Accent header strip */}
            <div className="h-1" style={{ background: accentColor }} />

            <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="h-12 w-12 flex items-center justify-center rounded-sm text-[13px] font-mono font-bold tracking-wider"
                            style={{
                                color: accentColor,
                                background: `hsl(var(${meta.accentVar}) / 0.1)`,
                                border: `1px solid hsl(var(${meta.accentVar}) / 0.3)`,
                            }}
                        >
                            {meta.initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="index-num tnum">№ {String(index + 1).padStart(2, '0')}</span>
                            </div>
                            <h3 className="font-serif text-[22px] text-foreground leading-none">{meta.name}</h3>
                            {broker.lastSuccessAt && (
                                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1 font-mono">
                                    <Clock className="h-2.5 w-2.5" />
                                    {relativeTime(broker.lastSuccessAt)}
                                    {broker.lastDurationMs != null && <span className="text-muted-foreground/60">· {broker.lastDurationMs}ms</span>}
                                </p>
                            )}
                        </div>
                    </div>
                    <StatusPill broker={broker} />
                </div>

                {profile && (
                    <div className="mb-6 px-5 py-4 border-l-2 border-[hsl(var(--accent))]/40 bg-muted/40">
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="eyebrow-strong">Account</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                            <InfoRow icon={User} label="Holder" value={profile.user_name} />
                            <InfoRow icon={Mail} label="Email" value={profile.email} />
                            <InfoRow icon={Shield} label="Client ID" value={profile.user_id} />
                            <InfoRow icon={Globe} label="Broker" value={profile.broker} />
                            {profile.exchanges?.length > 0 && <InfoRow icon={BarChart3} label="Exchanges" value={profile.exchanges.join(', ')} />}
                            {profile.products?.length > 0 && <InfoRow icon={Wallet} label="Products" value={profile.products.join(', ')} />}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-3">
                        <RefreshCw className="h-3 w-3 text-muted-foreground" />
                        <span className="eyebrow-strong">Sync Status</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border border-y border-border">
                        <div className="px-4 py-3">
                            <p className="eyebrow mb-1">Last Sync</p>
                            <p className="text-[13px] font-medium text-foreground">{relativeTime(broker.lastSuccessAt) || 'Never'}</p>
                            {broker.lastSuccessAt && (
                                <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">{formatDateTime(broker.lastSuccessAt)}</p>
                            )}
                        </div>
                        <div className="px-4 py-3">
                            <p className="eyebrow mb-1">Status</p>
                            <p className={cn('text-[13px] font-medium', {
                                'text-[hsl(var(--gain))]': broker.lastStatus === 'SUCCESS',
                                'text-[hsl(var(--loss))]': broker.lastStatus === 'FAILURE',
                                'text-[hsl(var(--chart-4))]': broker.lastStatus === 'PARTIAL_FAILURE',
                                'text-muted-foreground': !broker.lastStatus || broker.lastStatus === 'NEVER_SYNCED',
                            })}>
                                {broker.lastStatus === 'SUCCESS' ? 'Success'
                                    : broker.lastStatus === 'FAILURE' ? 'Failed'
                                        : broker.lastStatus === 'PARTIAL_FAILURE' ? 'Partial'
                                            : broker.lastStatus === 'NEVER_SYNCED' ? 'Never' : '—'}
                            </p>
                        </div>
                        {broker.lastDurationMs && (
                            <div className="px-4 py-3 col-span-2 sm:col-span-1">
                                <p className="eyebrow mb-1">Duration</p>
                                <p className="text-[13px] font-medium text-foreground font-mono tnum">
                                    {broker.lastDurationMs < 1000 ? `${broker.lastDurationMs}ms` : `${(broker.lastDurationMs / 1000).toFixed(1)}s`}
                                </p>
                            </div>
                        )}
                    </div>
                    {broker.lastError && (
                        <div className="mt-3 flex items-start gap-2 p-3 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss))]/8">
                            <AlertCircle className="h-3 w-3 text-[hsl(var(--loss))] mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-[hsl(var(--loss))]">{broker.lastError}</p>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="eyebrow-strong">Capabilities</span>
                        <span className="index-num tnum">{meta.capabilities.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {meta.capabilities.map(cap => (
                            <span
                                key={cap}
                                className={cn(
                                    'inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.06em] px-2 py-1 border rounded-sm',
                                    isActive
                                        ? 'text-[hsl(var(--gain))] border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/5'
                                        : 'text-muted-foreground border-border bg-muted'
                                )}
                            >
                                {isActive ? <Check className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                                {cap}
                            </span>
                        ))}
                    </div>
                </div>

                {needsReconnect && (
                    <div className="mb-4 flex items-start gap-2 p-3 border-l-2 border-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4))]/8">
                        <AlertCircle className="h-3 w-3 text-[hsl(var(--chart-4))] mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-foreground/80">
                            Your {meta.name} session expired or was rejected. Credentials are still saved —
                            just reauthorize to resume syncing.
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-5 border-t border-hairline">
                    {needsReconnect && meta.slug && (
                        <button
                            onClick={handleReconnect}
                            disabled={reconnecting}
                            className="ed-btn ed-btn-accent"
                        >
                            <RefreshCw className={cn('h-3 w-3', reconnecting && 'animate-spin')} />
                            {reconnecting ? 'Redirecting…' : `Reconnect ${meta.name}`}
                        </button>
                    )}
                    {!needsReconnect && !isActive && meta.slug && (
                        <Link href="/brokers">
                            <button className="ed-btn ed-btn-accent">
                                <RefreshCw className="h-3 w-3" /> Connect
                            </button>
                        </Link>
                    )}
                    {isActive && !needsReconnect && meta.slug && (
                        <Link href={`/brokers/${meta.slug}`}>
                            <button className="ed-btn ed-btn-ghost">
                                <ExternalLink className="h-3 w-3" /> Manage
                            </button>
                        </Link>
                    )}
                    <Link href="/portfolio?tab=holdings">
                        <button className="ed-btn ed-btn-ghost">
                            View Holdings
                        </button>
                    </Link>
                </div>
            </div>
        </article>
    );
}

export function ProfileTab() {
    const { data: syncData, isLoading: syncLoading } = useBrokerConnection();
    const { data: profileData } = useQuery({
        queryKey: ['portfolio', 'profile'],
        queryFn: portfolioAPI.getProfile,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    if (syncLoading) return <TabLoadingSkeleton rows={4} columns={3} />;

    const brokers = syncData?.brokers ?? [];

    if (brokers.length === 0) {
        return (
            <section className="ed-card relative px-8 py-14 text-center">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />
                <Link2 className="h-6 w-6 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="font-serif italic text-[24px] text-foreground mb-1">No brokers on file.</h3>
                <p className="text-[12px] text-muted-foreground max-w-xs mx-auto mb-5">
                    Connect a brokerage account to view portfolio data, sync holdings, and track performance.
                </p>
                <Link href="/brokers">
                    <button className="ed-btn ed-btn-primary">Connect a Broker</button>
                </Link>
            </section>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between pb-4 border-b border-border">
                <div className="flex items-baseline gap-3">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground self-center" />
                    <span className="eyebrow-strong">Connected Vendors</span>
                    <span className="index-num tnum">[{String(brokers.length).padStart(2, '0')}]</span>
                </div>
            </div>

            <div className="space-y-5 stagger-fade">
                {brokers.map((b, i) => (
                    <BrokerProfileCard key={b.broker} broker={b} profileData={profileData} index={i} />
                ))}
            </div>

            <p className="font-serif italic text-[11px] text-muted-foreground text-center pt-2">
                Zerodha sessions expire daily at 06:00 IST. Reconnect to refresh authorization.
            </p>
        </div>
    );
}
