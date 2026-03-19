// src/components/portfolio/tabs/ProfileTab.jsx
'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { portfolioAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { containerVariants, itemVariants, useMotionVariants } from '@/lib/motion';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

// ── Broker metadata ─────────────────────────────────────────────

const BROKER_META = {
    ZERODHA: {
        name: 'Zerodha',
        initials: 'ZE',
        slug: 'zerodha',
        color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        accent: 'border-blue-500',
        capabilities: ['Holdings', 'Positions', 'Funds', 'MF Holdings', 'MF SIPs', 'Orders'],
    },
    ANGEL_ONE: {
        name: 'Angel One',
        initials: 'AO',
        slug: 'angelone',
        color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        accent: 'border-orange-500',
        capabilities: ['Holdings', 'Positions', 'Funds', 'Orders', 'Trades'],
    },
    UPSTOX: {
        name: 'Upstox',
        initials: 'UP',
        slug: 'upstox',
        color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
        accent: 'border-purple-500',
        capabilities: ['Holdings', 'Positions', 'Funds', 'Orders'],
    },
};

// ── Helpers ─────────────────────────────────────────────────────

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

function formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ── Info row component ──────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, className }) {
    if (!value || value === '—') return null;
    return (
        <div className={cn('flex items-start gap-3 py-2', className)}>
            <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-sm text-foreground break-all">{value}</p>
            </div>
        </div>
    );
}

// ── Status badge ────────────────────────────────────────────────

function StatusBadge({ broker }) {
    const isActive = broker.tokenActive;
    const isExpired = !isActive && broker.lastStatus !== null && broker.lastStatus !== 'NEVER_SYNCED';

    if (isActive) {
        return <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>;
    }
    if (isExpired) {
        return <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Session Expired</span>;
    }
    return <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Not connected</span>;
}

// ── Capability pills ────────────────────────────────────────────

function CapabilityPills({ capabilities, isActive }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {capabilities.map(cap => (
                <div key={cap} className={cn(
                    'text-[11px] rounded-md px-2 py-1 flex items-center gap-1 border',
                    isActive
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                )}>
                    {isActive ? <Check size={10} /> : <Minus size={10} />}
                    {cap}
                </div>
            ))}
        </div>
    );
}

// ── Sync detail row ─────────────────────────────────────────────

function SyncDetails({ broker }) {
    const lastSync = relativeTime(broker.lastSuccessAt);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Last Sync</p>
                <p className="text-sm font-medium text-foreground">{lastSync || 'Never'}</p>
                {broker.lastSuccessAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(broker.lastSuccessAt)}</p>
                )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Status</p>
                <p className={cn('text-sm font-medium', {
                    'text-green-600': broker.lastStatus === 'SUCCESS',
                    'text-red-600': broker.lastStatus === 'FAILURE',
                    'text-amber-600': broker.lastStatus === 'PARTIAL_FAILURE',
                    'text-muted-foreground': !broker.lastStatus || broker.lastStatus === 'NEVER_SYNCED',
                })}>
                    {broker.lastStatus === 'SUCCESS' ? 'Success'
                        : broker.lastStatus === 'FAILURE' ? 'Failed'
                            : broker.lastStatus === 'PARTIAL_FAILURE' ? 'Partial'
                                : broker.lastStatus === 'NEVER_SYNCED' ? 'Never synced'
                                    : '—'}
                </p>
            </div>
            {broker.lastDurationMs && (
                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Duration</p>
                    <p className="text-sm font-medium text-foreground">
                        {broker.lastDurationMs < 1000
                            ? `${broker.lastDurationMs}ms`
                            : `${(broker.lastDurationMs / 1000).toFixed(1)}s`}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Broker Profile Card ─────────────────────────────────────────

function BrokerProfileCard({ broker, profileData }) {
    const item = useMotionVariants(itemVariants);
    const meta = BROKER_META[broker.broker] || {
        name: broker.broker,
        initials: broker.broker?.slice(0, 2),
        color: 'bg-gray-500/15 text-gray-600',
        accent: 'border-gray-500',
        capabilities: [],
    };

    const isActive = broker.tokenActive;

    // Match profile data to this broker (currently profile API returns Zerodha data)
    const profile = broker.broker === 'ZERODHA' ? profileData : null;

    return (
        <motion.div
            variants={item}
            className={cn(
                'bg-white dark:bg-gray-900/60 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-sm',
                'border-gray-200 dark:border-gray-800'
            )}
        >
            {/* Header with accent bar */}
            <div className={cn('border-t-[3px]', meta.accent)} />

            <div className="p-5 sm:p-6">
                {/* Broker identity + status */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold', meta.color)}>
                            {meta.initials}
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">{meta.name}</h3>
                            {broker.lastSuccessAt && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock size={10} />
                                    Last synced {relativeTime(broker.lastSuccessAt)}
                                    {broker.lastDurationMs != null && (
                                        <span className="text-gray-400 dark:text-gray-500">· {broker.lastDurationMs}ms</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                    <StatusBadge broker={broker} />
                </div>

                {/* Account info from profile API */}
                {profile && (
                    <div className="mb-5 bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <User size={12} />
                            Account Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                            <InfoRow icon={User} label="Name" value={profile.user_name} />
                            <InfoRow icon={Mail} label="Email" value={profile.email} />
                            <InfoRow icon={Shield} label="Client ID" value={profile.user_id} />
                            <InfoRow icon={Globe} label="Broker" value={profile.broker} />
                            {profile.exchanges?.length > 0 && (
                                <InfoRow icon={BarChart3} label="Exchanges" value={profile.exchanges.join(', ')} />
                            )}
                            {profile.products?.length > 0 && (
                                <InfoRow icon={Wallet} label="Products" value={profile.products.join(', ')} />
                            )}
                        </div>
                    </div>
                )}

                {/* Sync details */}
                <div className="mb-5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <RefreshCw size={12} />
                        Sync Status
                    </h4>
                    <SyncDetails broker={broker} />
                    {broker.lastError && (
                        <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-700 dark:text-red-400">{broker.lastError}</p>
                        </div>
                    )}
                </div>

                {/* Capabilities */}
                <div className="mb-5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Capabilities
                    </h4>
                    <CapabilityPills capabilities={meta.capabilities} isActive={isActive} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {!isActive && meta.slug && (
                        <Link href="/brokers">
                            <button className="h-8 px-4 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                                <RefreshCw size={12} />
                                Reconnect
                            </button>
                        </Link>
                    )}
                    {isActive && meta.slug && (
                        <Link href={`/brokers/${meta.slug}`}>
                            <button className="h-8 px-4 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                                <ExternalLink size={12} />
                                Manage
                            </button>
                        </Link>
                    )}
                    <Link href="/portfolio?tab=holdings">
                        <button className="h-8 px-4 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            View Holdings
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

// ── Main ProfileTab ─────────────────────────────────────────────

export function ProfileTab() {
    const { data: syncData, isLoading: syncLoading } = useBrokerConnection();
    const { data: profileData } = useQuery({
        queryKey: ['portfolio', 'profile'],
        queryFn: portfolioAPI.getProfile,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
    const container = useMotionVariants(containerVariants);

    if (syncLoading) return <TabLoadingSkeleton rows={4} columns={3} />;

    const brokers = syncData?.brokers ?? [];

    if (brokers.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 flex flex-col items-center text-center gap-3 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Link2 size={24} className="text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No brokers connected</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Connect your brokerage account to view portfolio data, sync holdings, and track performance.
                </p>
                <Link href="/brokers" className="mt-2">
                    <button className="h-9 px-5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        Connect a Broker
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-5">
            <div className="flex items-center gap-2">
                <Shield size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Connected Brokers</h2>
                <span className="text-xs text-muted-foreground ml-1">({brokers.length})</span>
            </div>

            {brokers.map(b => (
                <BrokerProfileCard
                    key={b.broker}
                    broker={b}
                    profileData={profileData}
                />
            ))}

            {/* Info footer */}
            <p className="text-[11px] text-muted-foreground text-center pt-2">
                Zerodha sessions expire daily at 6:00 AM IST. Reconnect to refresh your session.
            </p>
        </motion.div>
    );
}
