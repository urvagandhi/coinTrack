'use client';

import {
  AlertCircle,
  ArrowRight,
  Clock,
  Key,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Parses timestamp cleanly with fallback to Indian Standard Time offset (+05:30)
 * when Jackson produces LocalDateTime without an explicit timezone offset.
 */
function formatLastSynced(iso, now) {
  if (!iso) return 'Never';
  let date;
  if (typeof iso === 'string') {
    const clean =
      !iso.includes('Z') && !iso.includes('+') && !/-\d\d:\d\d$/.test(iso)
        ? `${iso}+05:30`
        : iso;
    date = new Date(clean);
  } else {
    date = new Date(iso);
  }
  if (isNaN(date.getTime())) return 'Never';

  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  let rel;
  if (diffSec < 10) {
    rel = 'just now';
  } else if (diffSec < 60) {
    rel = `${diffSec}s ago`;
  } else {
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) {
      rel = `${mins}m ago`;
    } else {
      const hours = Math.floor(mins / 60);
      if (hours < 24) {
        rel = `${hours}h ago`;
      } else {
        rel = `${Math.floor(hours / 24)}d ago`;
      }
    }
  }

  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
  return `${timeStr} IST (${rel})`;
}

/**
 * High-craft Connection Hub Panel.
 * Dynamically hydrated from backend /api/portfolio/sync/status:
 * - Dynamic channels list (Equity Holdings, Mutual Funds, Positions & F&O, Funds & Margin) with actual record counts and streaming status.
 * - Dynamic telemetry metrics (Last Synced, Protocol, Security Mode, Gateway Health with real latency ms).
 */
export function ConnectionHubPanel({
  broker,
  brokerStatus,
  isConnected,
  isExpired,
  lastSyncedAt,
  relativeTimeStr,
  onManualSync,
  isManualSyncing,
  onRefreshToken,
  isRefreshingToken,
  onUnlink,
  isUnlinking,
  error,
}) {
  // Use dynamic channels from backend if available; otherwise fallback to sensible defaults
  const channels = brokerStatus?.channels || [
    {
      id: 'EQUITY_HOLDINGS',
      name: 'Equity Holdings',
      desc: 'Demat portfolio, purchase price & daily gain',
      tag: 'NSE / BSE',
      supported: true,
      streaming: isConnected,
      status: isConnected ? 'Streaming' : 'Idle',
      recordCount: 0,
    },
    {
      id: 'MF_HOLDINGS',
      name: 'Mutual Funds',
      desc:
        broker.key === 'ZERODHA'
          ? 'Folio numbers, units held & live NAVs'
          : 'Not supported by broker API',
      tag: 'AMFI Daily',
      supported: broker.key === 'ZERODHA',
      streaming: isConnected && broker.key === 'ZERODHA',
      status:
        broker.key !== 'ZERODHA'
          ? 'Unsupported'
          : isConnected
            ? 'Streaming'
            : 'Idle',
      recordCount: 0,
    },
    {
      id: 'POSITIONS_FNO',
      name: 'Positions & F&O',
      desc: 'Intraday & open derivative contracts',
      tag: 'Real-Time',
      supported: true,
      streaming: isConnected,
      status: isConnected ? 'Streaming' : 'Idle',
      recordCount: 0,
    },
    {
      id: 'FUNDS_MARGIN',
      name: 'Funds & Margin',
      desc: 'Available cash balance, collateral & margin utilized',
      tag: 'Ledger',
      supported: true,
      streaming: isConnected,
      status: isConnected ? 'Streaming' : 'Idle',
      recordCount: 0,
    },
  ];

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeChannelsCount = channels.filter(c => c.streaming).length;
  const protocolName =
    brokerStatus?.protocol ||
    (broker.authType === 'oauth' ? 'OAuth 2.0 REST' : 'Direct SmartAPI');
  const securityMode = brokerStatus?.securityMode || 'Read-Only Enforced';
  const gatewayHealth =
    brokerStatus?.gatewayHealth || (isConnected ? 'Operational' : 'Idle');
  const latencyDisplay =
    brokerStatus?.gatewayLatencyMs != null
      ? ` (${Math.round(brokerStatus.gatewayLatencyMs)}ms)`
      : '';

  const effectiveTimestamp = lastSyncedAt || brokerStatus?.lastSuccessAt;
  const effectiveTimeStr = useMemo(() => {
    if (effectiveTimestamp) {
      return formatLastSynced(effectiveTimestamp, now);
    }
    return relativeTimeStr || 'Never synced';
  }, [effectiveTimestamp, now, relativeTimeStr]);

  return (
    <div className='space-y-6 sm:space-y-7'>
      {/* ── 1. SECTION HEADER ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
            Connection Hub
          </h2>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Active session telemetry, syndicated asset feeds, and gateway
            diagnostics.
          </p>
        </div>

        {isConnected && (
          <div className='flex items-center gap-2 self-start sm:self-auto'>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'>
              <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
              Live Telemetry Active
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className='flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300'>
          <AlertCircle className='size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5' />
          <span>{error}</span>
        </div>
      )}

      {isConnected ? (
        <div className='space-y-6'>
          {/* ── 2. HERO STATUS CARD (Quiet Chrome + Interlock Brand Moment) ── */}
          <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs space-y-5'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='flex items-center gap-3.5'>
                <div className='size-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center p-2 shrink-0 shadow-2xs'>
                  {broker.logoPath ? (
                    <img
                      src={broker.logoPath}
                      alt={broker.displayName}
                      className='size-full object-contain'
                    />
                  ) : (
                    <span className='font-bold text-sm text-neutral-800 dark:text-neutral-200'>
                      {broker.initials}
                    </span>
                  )}
                </div>

                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                      {broker.displayName} Authenticated
                    </h3>
                    <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                  </div>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                    Connected via {broker.displayName} Gateway. Encrypted
                    AES-256 session token active.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex items-center gap-2.5 shrink-0'>
                <button
                  type='button'
                  onClick={onManualSync}
                  disabled={isManualSyncing}
                  className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5',
                      isManualSyncing && 'animate-spin'
                    )}
                  />
                  <span>{isManualSyncing ? 'Syncing…' : 'Sync Feeds Now'}</span>
                </button>

                <button
                  type='button'
                  onClick={onRefreshToken}
                  disabled={isRefreshingToken}
                  className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-xs cursor-pointer'
                >
                  <Key className='size-3.5 text-neutral-400' />
                  <span>Refresh Token</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Metrics Matrix */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-xs'>
              <div className='p-3 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                  <Clock className='size-3 text-neutral-400' />
                  Last Synced
                </span>
                <span className='font-semibold text-neutral-800 dark:text-neutral-200 block truncate'>
                  {effectiveTimeStr}
                </span>
              </div>

              <div className='p-3 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                  <Server className='size-3 text-neutral-400' />
                  Protocol
                </span>
                <span className='font-semibold text-neutral-800 dark:text-neutral-200 block truncate'>
                  {protocolName}
                </span>
              </div>

              <div className='p-3 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                  <ShieldCheck className='size-3 text-emerald-500' />
                  Security Mode
                </span>
                <span className='font-semibold text-emerald-600 dark:text-emerald-400 block truncate'>
                  {securityMode}
                </span>
              </div>

              <div className='p-3 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                  <Wifi className='size-3 text-blue-500' />
                  Gateway Health
                </span>
                <span className='font-semibold text-neutral-800 dark:text-neutral-200 block truncate'>
                  {gatewayHealth}
                  {latencyDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. SYNDICATED FEEDS MATRIX ── */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500'>
                Syndicated Data Channels
              </h4>
              <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                {activeChannelsCount} of {channels.length} channels streaming
              </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {channels.map((channel, idx) => {
                const isStreamActive = channel.streaming;
                const isUnsupported = !channel.supported;

                return (
                  <div
                    key={channel.id || idx}
                    className={cn(
                      'p-4 rounded-xl border bg-white dark:bg-[#16171a] flex items-start justify-between gap-3 shadow-2xs transition-colors',
                      isUnsupported
                        ? 'border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
                        : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    )}
                  >
                    <div className='space-y-1 min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate'>
                          {channel.name}
                        </span>
                        <span className='text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium shrink-0'>
                          {channel.tag}
                        </span>
                      </div>
                      <p className='text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal line-clamp-2'>
                        {channel.desc}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 border',
                        isStreamActive
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40'
                          : isUnsupported
                            ? 'text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200/40 dark:border-neutral-700/40'
                            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40'
                      )}
                    >
                      {isStreamActive && (
                        <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                      )}
                      <span>{channel.status}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4. FOOTER & UNLINK ROW ── */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80'>
            <Link
              href='/portfolio?tab=holdings'
              className='inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
            >
              <span>View Synced Holdings in Portfolio</span>
              <ArrowRight className='size-3.5' />
            </Link>

            <button
              type='button'
              onClick={onUnlink}
              disabled={isUnlinking}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer self-start sm:self-auto'
            >
              <Trash2 className='size-3.5' />
              <span>Unlink Broker Account</span>
            </button>
          </div>
        </div>
      ) : (
        /* Disconnected State */
        <div className='p-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-center space-y-4 py-12'>
          <div className='size-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto'>
            <Key className='size-5' />
          </div>
          <div>
            <h3 className='text-sm sm:text-base font-bold text-foreground'>
              {broker.displayName} Not Connected
            </h3>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto'>
              Provide your API credentials in the Credentials tab to syndicate
              your portfolio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectionHubPanel;
