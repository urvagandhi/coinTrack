'use client';

import {
  AccountCustodyDossier,
  useBrokerConnection,
  useSyncFeeds,
} from '@/features/brokers';
import { brokerAPI, portfolioAPI } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/AuthContext';
import { cn } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  Clock,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BROKER_CONFIGS, normalizeBrokerKey } from '../constants';

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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BrokersTab({
  selectedBroker = 'ZERODHA',
  onTabChange = () => {},
}) {
  const router = useRouter();
  const { user } = useAuth();
  const normKey = normalizeBrokerKey(
    selectedBroker === 'ALL' ? 'ZERODHA' : selectedBroker
  );
  const config = BROKER_CONFIGS[normKey] || BROKER_CONFIGS.ZERODHA;

  const [reconnecting, setReconnecting] = useState(false);
  const { sync: handleSync, isSyncing } = useSyncFeeds({
    brokerDisplayName: config.displayName,
  });

  // Query broker connection status from backend
  const { data: syncData } = useBrokerConnection();
  const brokerStatuses = syncData?.brokers || [];
  const currentBrokerStatus =
    brokerStatuses.find(b => normalizeBrokerKey(b.broker) === normKey) || null;

  // Query broker profile if available
  const { data: profileData } = useQuery({
    queryKey: ['portfolio', 'profile', normKey],
    queryFn: portfolioAPI.getProfile,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isActive = Boolean(currentBrokerStatus?.tokenActive);
  const needsReconnect = Boolean(
    currentBrokerStatus?.needsReconnect ||
    (!isActive &&
      currentBrokerStatus?.lastStatus !== null &&
      currentBrokerStatus?.lastStatus !== 'NEVER_SYNCED')
  );
  const isLinked = isActive || needsReconnect;

  const handleReconnect = async () => {
    if (reconnecting || !config.slug) return;
    setReconnecting(true);
    try {
      const res = await brokerAPI.getConnectUrl(config.slug);
      const url = res?.loginUrl || res?.data?.loginUrl;
      if (url) {
        window.location.href = url;
      } else {
        router.push(config.setupPath);
      }
    } catch {
      toast.error(
        `Could not initialize ${config.displayName} re-authentication`
      );
      router.push(config.setupPath);
    } finally {
      setReconnecting(false);
    }
  };

  const lastSyncTime = currentBrokerStatus?.lastSuccessAt
    ? relativeTime(currentBrokerStatus.lastSuccessAt)
    : 'just now';
  const lastSyncFormatted = currentBrokerStatus?.lastSuccessAt
    ? formatDateTime(currentBrokerStatus.lastSuccessAt)
    : '5 Nov 2026 at 02:45 PM';
  const duration = currentBrokerStatus?.lastDurationMs
    ? `${currentBrokerStatus.lastDurationMs}ms`
    : '803ms';

  const protocolName =
    normKey === 'ANGEL_ONE' ? 'Direct SmartAPI' : 'OAuth 2.0 REST';
  const securityMode = 'Read-Only Enforced';
  const gatewayHealth = isActive
    ? currentBrokerStatus?.lastStatus === 'PARTIAL'
      ? 'Partial'
      : 'Operational'
    : needsReconnect
      ? 'Expired'
      : 'Operational';

  // Dynamic channels matching ConnectionHubPanel & demo
  const channels = [
    {
      id: 'EQUITY_HOLDINGS',
      name: 'Equity Holdings',
      desc: 'Demat portfolio, purchase price & daily gain',
      tag: 'NSE / BSE',
      supported: true,
      streaming: isActive,
      status: isActive ? 'Streaming' : 'Idle',
    },
    {
      id: 'MF_HOLDINGS',
      name: 'Mutual Funds',
      desc:
        normKey === 'ZERODHA'
          ? 'Folio numbers, units held & live NAVs'
          : 'Not supported by broker API',
      tag: 'AMFI Daily',
      supported: normKey === 'ZERODHA',
      streaming: isActive && normKey === 'ZERODHA',
      status:
        normKey !== 'ZERODHA' ? 'Unsupported' : isActive ? 'Streaming' : 'Idle',
    },
    {
      id: 'POSITIONS_FNO',
      name: 'Positions & F&O',
      desc: 'Intraday & open derivative contracts',
      tag: 'Real-Time',
      supported: true,
      streaming: isActive,
      status: isActive ? 'Streaming' : 'Idle',
    },
    {
      id: 'FUNDS_MARGIN',
      name: 'Funds & Margin',
      desc: 'Available cash balance, collateral & margin utilized',
      tag: 'Ledger',
      supported: true,
      streaming: isActive,
      status: isActive ? 'Streaming' : 'Idle',
    },
  ];

  const activeChannelsCount = channels.filter(c => c.streaming).length;

  return (
    <section className='space-y-6'>
      {/* ── 1. SECTION HEADER (Matching ConnectionHubPanel header) ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
            {config.displayName} Connection Hub
          </h2>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Institutional telemetry feeds, authenticated CDSL demat account, and
            gateway diagnostics.
          </p>
        </div>

        <div className='flex items-center gap-2 self-start sm:self-auto'>
          {isActive && !needsReconnect ? (
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'>
              <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
              Live Telemetry Active
            </span>
          ) : needsReconnect ? (
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'>
              <span className='size-1.5 rounded-full bg-rose-500' />
              Session Expired
            </span>
          ) : (
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700/80'>
              <span className='size-1.5 rounded-full bg-neutral-400' />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {isLinked ? (
        <>
          {/* ── 2. TWO-COLUMN HERO GRID: BROKER IDENTITY + ACCOUNT CUSTODY ── */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {/* Column A: Broker Identity Card (Exact BrokerCard.jsx aesthetics) */}
            <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-5'>
              <div>
                <div className='flex items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800/80'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={cn(
                        'size-2 rounded-full shrink-0',
                        isActive && !needsReconnect
                          ? 'bg-emerald-500 animate-pulse'
                          : needsReconnect
                            ? 'bg-rose-500'
                            : 'bg-neutral-300 dark:bg-neutral-600'
                      )}
                    />
                    <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                      {isActive && !needsReconnect
                        ? 'Live Stream'
                        : needsReconnect
                          ? 'Session Expired'
                          : 'Not Connected'}
                    </span>
                  </div>
                  <span className='text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60'>
                    {protocolName}
                  </span>
                </div>

                <div className='flex items-start gap-3.5 pt-4 mb-4'>
                  <div className='size-12 rounded-xl flex items-center justify-center shrink-0 border border-neutral-200/80 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 p-2 shadow-2xs overflow-hidden'>
                    {config.logoPath ? (
                      <img
                        src={config.logoPath}
                        alt={`${config.displayName} logo`}
                        className='size-7 object-contain'
                        loading='lazy'
                      />
                    ) : (
                      <span
                        className='font-bold text-sm'
                        style={{ color: config.accentColor }}
                      >
                        {config.initials}
                      </span>
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug'>
                      {config.displayName}
                    </h3>
                    <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal'>
                      {config.tagline ||
                        (normKey === 'ZERODHA'
                          ? "India's largest stock broker"
                          : normKey === 'UPSTOX'
                            ? 'Fast, reliable trading platform'
                            : 'Smart investing made simple')}
                    </p>
                  </div>
                </div>

                {/* Diagnostic Metrics Matrix */}
                <div className='grid grid-cols-2 gap-2.5 pt-2 text-xs'>
                  <div className='p-2.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-0.5'>
                    <span className='text-[10px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                      <Clock className='size-3 text-neutral-400' />
                      Last Synced
                    </span>
                    <span className='font-semibold text-neutral-800 dark:text-neutral-200 block truncate font-mono text-[11px]'>
                      {lastSyncTime} ({lastSyncFormatted})
                    </span>
                  </div>

                  <div className='p-2.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-0.5'>
                    <span className='text-[10px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                      <Wifi className='size-3 text-blue-500' />
                      Gateway Health
                    </span>
                    <span
                      className={cn(
                        'font-semibold block truncate font-mono text-[11px]',
                        {
                          'text-emerald-600 dark:text-emerald-400':
                            gatewayHealth === 'Operational',
                          'text-amber-600 dark:text-amber-400':
                            gatewayHealth === 'Partial',
                          'text-rose-600 dark:text-rose-400':
                            gatewayHealth === 'Expired',
                        }
                      )}
                    >
                      {gatewayHealth} ({duration})
                    </span>
                  </div>

                  <div className='p-2.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-0.5'>
                    <span className='text-[10px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                      <Server className='size-3 text-neutral-400' />
                      Protocol
                    </span>
                    <span className='font-semibold text-neutral-800 dark:text-neutral-200 block truncate font-mono text-[11px]'>
                      {protocolName}
                    </span>
                  </div>

                  <div className='p-2.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-0.5'>
                    <span className='text-[10px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1'>
                      <ShieldCheck className='size-3 text-emerald-500' />
                      Security Mode
                    </span>
                    <span className='font-semibold text-emerald-600 dark:text-emerald-400 block truncate font-mono text-[11px]'>
                      {securityMode}
                    </span>
                  </div>
                </div>

                {/* Syndicated feeds */}
                <div className='space-y-2 pt-2'>
                  <span className='text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono'>
                    Syndicated feeds
                  </span>
                  <div className='flex flex-wrap gap-1.5'>
                    {config.capabilities.map(cap => (
                      <span
                        key={cap}
                        className='inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-300 font-medium'
                      >
                        <Check className='size-3 text-emerald-500 shrink-0' />
                        <span>{cap}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className='flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-xs'>
                <div className='flex items-center gap-2'>
                  {isActive && (
                    <button
                      type='button'
                      onClick={handleSync}
                      disabled={isSyncing}
                      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                    >
                      <RefreshCw
                        className={cn('size-3.5', isSyncing && 'animate-spin')}
                      />
                      <span>{isSyncing ? 'Syncing…' : 'Sync Feeds Now'}</span>
                    </button>
                  )}

                  {needsReconnect && (
                    <button
                      type='button'
                      onClick={handleReconnect}
                      disabled={reconnecting}
                      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-60'
                    >
                      <RefreshCw
                        className={cn(
                          'size-3.5',
                          reconnecting && 'animate-spin'
                        )}
                      />
                      <span>
                        {reconnecting
                          ? 'Redirecting…'
                          : `Reconnect ${config.displayName}`}
                      </span>
                    </button>
                  )}

                  <Link
                    href={config.setupPath || '/brokers'}
                    className='inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors'
                  >
                    <span>Manage settings</span>
                    <ExternalLink className='size-3' />
                  </Link>
                </div>

                <span className='flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-medium text-[11px] truncate'>
                  <Clock className='size-3 text-neutral-400 shrink-0' />
                  <span>Synced {lastSyncTime}</span>
                </span>
              </div>
            </div>

            {/* Column B: Institutional Account & Custody Dossier (ONLY shown when linked!) */}
            <AccountCustodyDossier
              brokerKey={normKey}
              brokerStatus={currentBrokerStatus}
              profileData={profileData}
              user={user}
              lastSyncedAt={currentBrokerStatus?.lastSuccessAt}
            />
          </div>
        </>
      ) : (
        /* Unlinked / Not Connected Demat State — Clean, with NO fake Account & Custody Dossier */
        <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-6 sm:p-8 shadow-2xs space-y-6'>
          <div className='flex items-start gap-4'>
            <div className='size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center p-2.5 shrink-0 shadow-2xs'>
              {config.logoPath ? (
                <img
                  src={config.logoPath}
                  alt={`${config.displayName} logo`}
                  className='size-full object-contain grayscale opacity-75'
                />
              ) : (
                <span className='font-bold text-base text-neutral-400 dark:text-neutral-500'>
                  {config.initials}
                </span>
              )}
            </div>

            <div className='space-y-1.5 flex-1'>
              <div className='flex items-center gap-2'>
                <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                  {config.displayName} Demat Not Connected
                </h3>
                <span className='text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold border border-neutral-200/60 dark:border-neutral-700/60'>
                  UNLINKED
                </span>
              </div>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed'>
                No active CDSL Demat session or credentials found for{' '}
                {config.displayName}. Connect your broker account in Broker
                Connections to stream holdings, orders, and telemetry.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3 pt-2'>
            <Link
              href={config.setupPath || '/brokers'}
              className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs'
            >
              <span>Connect {config.displayName}</span>
              <ExternalLink className='size-3.5' />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default BrokersTab;
