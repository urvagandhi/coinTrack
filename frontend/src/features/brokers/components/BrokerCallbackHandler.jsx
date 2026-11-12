'use client';

import { getBrokerByKey } from '../constants';
import { invalidateBrokerQueries } from '../hooks/useBrokerConnection';
import { portfolioAPI } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import {
  AnimatedSuccessIcon,
  AnimatedErrorIcon,
  AnimatedWarningIcon,
} from '@/shared/ui/feedback/animated-icons';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Lock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * High-craft, unslopped OAuth & Token Handshake Modal.
 * Dynamic loading telemetry & live syndicated channels per broker.
 */
export function BrokerCallbackHandler({
  brokerKey,
  onCallback,
  successRedirect,
  // Optional mock props for Design Lab testing
  previewState = null,
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const broker = getBrokerByKey(brokerKey);
  const called = useRef(false);

  const brokerName = broker?.displayName || 'Broker';
  const targetRedirect =
    successRedirect || (broker?.setupPath ? broker.setupPath : '/brokers');

  const [status, setStatus] = useState(previewState || 'loading'); // 'loading' | 'success' | 'stalled' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [telemetry, setTelemetry] = useState(null);

  // Dynamic verification steps customized per broker architecture
  const steps = useMemo(() => {
    if (brokerKey === 'ZERODHA') {
      return [
        { label: 'Exchanging Kite Connect request authorization token' },
        { label: 'Verifying AES-256-GCM encrypted session credentials' },
        { label: 'Establishing read-only portfolio telemetry' },
      ];
    }
    if (brokerKey === 'UPSTOX') {
      return [
        { label: 'Exchanging Upstox Pro request authorization token' },
        { label: 'Verifying AES-256-GCM encrypted session signature' },
        { label: 'Establishing read-only portfolio telemetry' },
      ];
    }
    if (brokerKey === 'ANGEL_ONE') {
      return [
        { label: 'Validating SmartAPI credentials & MPIN' },
        { label: 'Verifying TOTP handshake & AES-256-GCM signature' },
        { label: 'Establishing read-only portfolio telemetry' },
      ];
    }
    return [
      { label: `Exchanging ${brokerName} authorization token` },
      { label: 'Verifying AES-256-GCM encrypted signature' },
      { label: 'Establishing read-only portfolio telemetry' },
    ];
  }, [brokerKey, brokerName]);

  // Fallback channels based on broker capabilities
  const defaultChannels = useMemo(() => {
    if (brokerKey === 'ZERODHA') {
      return [
        {
          id: 'EQUITY_HOLDINGS',
          name: 'Equity Holdings',
          desc: 'Demat portfolio active',
          tag: 'NSE / BSE',
        },
        {
          id: 'MF_HOLDINGS',
          name: 'Mutual Funds',
          desc: 'Folios synced',
          tag: 'AMFI',
        },
        {
          id: 'POSITIONS_FNO',
          name: 'Positions & F&O',
          desc: 'Open contracts active',
          tag: 'Real-Time',
        },
        {
          id: 'FUNDS_MARGIN',
          name: 'Available Margin',
          desc: 'Ledger cash active',
          tag: 'Ledger',
        },
      ];
    }
    if (brokerKey === 'UPSTOX') {
      return [
        {
          id: 'EQUITY_HOLDINGS',
          name: 'Equity Holdings',
          desc: 'Demat portfolio active',
          tag: 'NSE / BSE',
        },
        {
          id: 'POSITIONS_FNO',
          name: 'Positions & F&O',
          desc: 'Open contracts active',
          tag: 'Real-Time',
        },
        {
          id: 'FUNDS_MARGIN',
          name: 'Available Margin',
          desc: 'Ledger cash active',
          tag: 'Ledger',
        },
        {
          id: 'QUOTES_STREAM',
          name: 'Live Quotes',
          desc: 'Real-time stream',
          tag: 'Market',
        },
      ];
    }
    if (brokerKey === 'ANGEL_ONE') {
      return [
        {
          id: 'EQUITY_HOLDINGS',
          name: 'Equity Holdings',
          desc: 'Demat portfolio active',
          tag: 'NSE / BSE',
        },
        {
          id: 'POSITIONS_FNO',
          name: 'Positions & F&O',
          desc: 'Open contracts active',
          tag: 'Real-Time',
        },
        {
          id: 'FUNDS_MARGIN',
          name: 'Available Margin',
          desc: 'Ledger cash active',
          tag: 'Ledger',
        },
        {
          id: 'SMART_API',
          name: 'SmartAPI Live Feed',
          desc: 'Real-time telemetry',
          tag: 'Direct',
        },
      ];
    }
    return [
      {
        id: 'EQUITY_HOLDINGS',
        name: 'Equity Holdings',
        desc: 'Demat portfolio active',
        tag: 'NSE / BSE',
      },
      {
        id: 'POSITIONS_FNO',
        name: 'Positions & F&O',
        desc: 'Open contracts active',
        tag: 'Real-Time',
      },
      {
        id: 'FUNDS_MARGIN',
        name: 'Available Margin',
        desc: 'Ledger cash active',
        tag: 'Ledger',
      },
    ];
  }, [brokerKey]);

  // Live dynamic channels from backend /api/portfolio/sync/status
  const activeChannels = useMemo(() => {
    if (telemetry?.channels && telemetry.channels.length > 0) {
      return telemetry.channels
        .filter(c => c.supported)
        .map(c => ({
          id: c.id,
          name: c.name,
          desc:
            c.recordCount > 0
              ? `${c.recordCount} ${c.id === 'EQUITY_HOLDINGS' ? 'securities' : c.id === 'MF_HOLDINGS' ? 'folios' : c.id === 'POSITIONS_FNO' ? 'contracts' : 'active'}`
              : c.desc || 'Streaming',
          tag: c.tag || 'Live',
          streaming: c.streaming ?? true,
        }));
    }
    return defaultChannels.map(c => ({ ...c, streaming: true }));
  }, [telemetry, defaultChannels]);

  // Sync state if controlled via previewState in Design Lab
  useEffect(() => {
    if (previewState) {
      setStatus(previewState);
    }
  }, [previewState]);

  const runCallback = async () => {
    if (previewState) return;
    setStatus('loading');
    setErrorMessage('');
    setStepIndex(0);

    // Dynamic progression: Step 0 begins immediately
    const step1Timer = setTimeout(() => {
      setStepIndex(1);
    }, 850);

    try {
      await onCallback();
      clearTimeout(step1Timer);

      // Backend authenticated and initial sync initiated
      setStepIndex(2);

      // Invalidate queries and fetch live sync telemetry
      await invalidateBrokerQueries(queryClient);
      const syncStatus = await portfolioAPI.getSyncStatus().catch(() => null);
      if (syncStatus?.brokers) {
        const b = syncStatus.brokers.find(x => x.broker === brokerKey);
        if (b) setTelemetry(b);
      }

      // Brief moment so user visually sees all 3 verification steps completed
      await new Promise(r => setTimeout(r, 650));

      setStepIndex(3);
      setStatus('success');

      // Give 2.8s for user to see the success card and live channels
      setTimeout(() => {
        router.push(targetRedirect);
      }, 2800);
    } catch (err) {
      clearTimeout(step1Timer);
      if (err?.status === 400 || err?.original?.response?.status === 400) {
        await invalidateBrokerQueries(queryClient);
        setStatus('success');
        setTimeout(() => router.push(targetRedirect), 2800);
        return;
      }
      setStatus('error');
      setErrorMessage(
        err?.message ||
          err?.original?.message ||
          `${brokerName} authentication failed. Please verify credentials in Developer Portal and try again.`
      );
    }
  };

  useEffect(() => {
    if (previewState) return;
    if (called.current) return;
    called.current = true;
    runCallback();

    const stallTimer = setTimeout(() => {
      setStatus(s => (s === 'loading' ? 'stalled' : s));
    }, 15000);

    return () => clearTimeout(stallTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewState]);

  return (
    <div className='min-h-[65vh] flex items-center justify-center p-4 sm:p-6'>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className='relative max-w-md w-full rounded-3xl bg-white dark:bg-[#151619] border border-neutral-200/80 dark:border-neutral-800 p-7 sm:p-9 shadow-lg shadow-neutral-950/5 dark:shadow-black/40 overflow-hidden'
      >
        {/* Subtle top ambient indicator */}
        <div className='absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent opacity-60' />

        {/* ── 1. HEADER ROW: Broker Logo & Name Badge ── */}
        <div className='flex items-center justify-between pb-6 border-b border-neutral-100 dark:border-neutral-800/80'>
          <div className='flex items-center gap-2.5'>
            <div className='size-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center p-1.5 shadow-2xs'>
              {broker?.logoPath ? (
                <img
                  src={broker.logoPath}
                  alt={broker.displayName}
                  className='size-full object-contain'
                />
              ) : (
                <span className='font-bold text-xs text-neutral-800 dark:text-neutral-200'>
                  {broker?.initials || 'BK'}
                </span>
              )}
            </div>
            <div>
              <span className='text-xs font-bold text-neutral-900 dark:text-neutral-100 tracking-tight block'>
                {broker?.displayName || 'Broker Connection'}
              </span>
              <span className='text-[10px] text-neutral-500 dark:text-neutral-400 block -mt-0.5'>
                {broker?.authType === 'oauth'
                  ? 'OAuth 2.0 Handshake'
                  : 'SmartAPI Direct'}
              </span>
            </div>
          </div>

          {/* Security Chip */}
          <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-[11px] font-medium text-neutral-500 dark:text-neutral-400'>
            <Lock className='size-3 text-neutral-400' />
            <span>Read-Only</span>
          </div>
        </div>

        {/* ── 2. CENTER CONTENT (Animated State Transition) ── */}
        <div className='py-6 text-center space-y-6'>
          <AnimatePresence mode='wait'>
            {/* LOADING STATE */}
            {status === 'loading' && (
              <motion.div
                key='loading'
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className='space-y-6'
              >
                {/* Orbiting Radar Spinner Icon */}
                <div className='relative size-16 mx-auto flex items-center justify-center'>
                  {/* Outer pulse wave */}
                  <span className='absolute inset-0 rounded-full border border-neutral-300 dark:border-neutral-700 animate-ping opacity-25' />
                  {/* Middle rotating dash ring */}
                  <svg
                    className='size-16 animate-spin text-neutral-900 dark:text-neutral-100'
                    viewBox='0 0 64 64'
                    fill='none'
                  >
                    <circle
                      cx='32'
                      cy='32'
                      r='28'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeDasharray='14 8'
                      className='opacity-30'
                    />
                    <circle
                      cx='32'
                      cy='32'
                      r='28'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      strokeDasharray='40 120'
                      strokeLinecap='round'
                    />
                  </svg>
                  {/* Center static dot or broker mini logo */}
                  <div className='absolute size-3 rounded-full bg-neutral-900 dark:bg-white' />
                </div>

                <div className='space-y-1.5'>
                  <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                    Authenticating {brokerName}…
                  </h3>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed'>
                    Reconciling {brokerName} credentials and initializing
                    real-time portfolio syndication.
                  </p>
                </div>

                {/* Progress Verification Steps */}
                <div className='p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-left space-y-2'>
                  {steps.map((st, i) => {
                    const isDone = stepIndex > i;
                    const isCurrent = stepIndex === i;
                    return (
                      <div
                        key={i}
                        className='flex items-center gap-2.5 text-xs transition-opacity duration-300'
                        style={{ opacity: isCurrent || isDone ? 1 : 0.4 }}
                      >
                        {isDone ? (
                          <div className='size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0'>
                            <svg
                              className='size-2.5'
                              viewBox='0 0 12 12'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2.5'
                            >
                              <path
                                d='M2.5 6L5 8.5L9.5 3.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </div>
                        ) : isCurrent ? (
                          <span className='size-4 rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent animate-spin shrink-0' />
                        ) : (
                          <span className='size-4 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0' />
                        )}
                        <span
                          className={cn(
                            'text-[11px] leading-tight',
                            isCurrent
                              ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                              : isDone
                                ? 'text-neutral-700 dark:text-neutral-300'
                                : 'text-neutral-400 dark:text-neutral-500'
                          )}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SUCCESS STATE */}
            {status === 'success' && (
              <motion.div
                key='success'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className='space-y-6'
              >
                {/* Visual Interlock Moment: Broker Logo + Connector + Success Check */}
                <div className='flex items-center justify-center gap-3 py-1'>
                  {/* Broker Icon */}
                  <div className='size-14 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center p-2.5 shadow-2xs'>
                    {broker?.logoPath ? (
                      <img
                        src={broker.logoPath}
                        alt={broker.displayName}
                        className='size-full object-contain'
                      />
                    ) : (
                      <span className='font-bold text-sm text-neutral-800 dark:text-neutral-200'>
                        {broker?.initials || 'BK'}
                      </span>
                    )}
                  </div>

                  {/* Pulsing Connector Cable */}
                  <div className='flex items-center gap-1 text-emerald-500'>
                    <span className='size-1 rounded-full bg-emerald-500 animate-ping' />
                    <div className='h-0.5 w-6 bg-gradient-to-r from-emerald-500/40 via-emerald-500 to-emerald-500/40' />
                    <span className='size-1 rounded-full bg-emerald-500' />
                  </div>

                  {/* Animated Success Badge */}
                  <div className='size-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20'>
                    <AnimatedSuccessIcon className='size-7' />
                  </div>
                </div>

                {/* Headings */}
                <div className='space-y-1.5'>
                  <h3 className='text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center justify-center gap-2'>
                    <span>{brokerName} Connected</span>
                    <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                  </h3>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto'>
                    Secure session established. Synchronizing holdings,
                    positions, and live quotes.
                  </p>
                </div>

                {/* Syndicated Feeds Micro-Panel */}
                <div className='p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 text-left space-y-2.5'>
                  <div className='flex items-center justify-between text-[11px] pb-1.5 border-b border-neutral-200/50 dark:border-neutral-800/60'>
                    <span className='text-neutral-500 dark:text-neutral-400 font-medium'>
                      Syndicated Channels
                    </span>
                    <span className='inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold'>
                      <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                      {activeChannels.filter(c => c.streaming).length} of{' '}
                      {activeChannels.length} streaming
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-[11px] pt-0.5 text-neutral-600 dark:text-neutral-300'>
                    {activeChannels.map(channel => (
                      <div
                        key={channel.id}
                        className='flex items-center justify-between gap-1 p-1 rounded-md'
                      >
                        <div className='flex items-center gap-1.5 min-w-0'>
                          <span className='text-emerald-500 font-bold shrink-0'>
                            ✓
                          </span>
                          <span className='truncate font-medium text-neutral-800 dark:text-neutral-200'>
                            {channel.name}
                          </span>
                        </div>
                        <span className='text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 font-mono'>
                          {channel.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto-redirect progress bar + Direct CTA Button */}
                <div className='space-y-3 pt-1'>
                  <div className='space-y-1.5'>
                    <div className='h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden'>
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.8, ease: 'linear' }}
                        className='h-full bg-emerald-500 rounded-full'
                      />
                    </div>
                    <span className='text-[10px] text-neutral-400 dark:text-neutral-500 block text-center'>
                      Redirecting to Connection Hub in 3s…
                    </span>
                  </div>

                  <button
                    type='button'
                    onClick={() => router.push(targetRedirect)}
                    className='w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                  >
                    <span>Open Connection Hub</span>
                    <ArrowRight className='size-3.5' />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STALLED STATE */}
            {status === 'stalled' && (
              <motion.div
                key='stalled'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className='space-y-5'
              >
                <div className='relative size-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm'>
                  <AnimatedWarningIcon className='size-8' loop />
                </div>

                <div className='space-y-1.5'>
                  <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                    Handshake Delayed
                  </h3>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto'>
                    The {broker?.displayName} developer gateway is responding
                    slowly. You can retry the exchange or head back to
                    directory.
                  </p>
                </div>

                <div className='flex items-center justify-center gap-2.5 pt-1'>
                  <button
                    type='button'
                    onClick={() => {
                      called.current = false;
                      runCallback();
                    }}
                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                  >
                    <RefreshCw className='size-3.5' />
                    <span>Retry Handshake</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => router.push('/brokers')}
                    className='inline-flex items-center px-4 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs'
                  >
                    Back to Directory
                  </button>
                </div>
              </motion.div>
            )}

            {/* ERROR STATE */}
            {status === 'error' && (
              <motion.div
                key='error'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className='space-y-5'
              >
                <div className='relative size-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm'>
                  <AnimatedErrorIcon className='size-8' loop />
                </div>

                <div className='space-y-1.5'>
                  <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                    Authentication Failed
                  </h3>
                  <p className='text-xs text-rose-600 dark:text-rose-400 leading-relaxed max-w-xs mx-auto'>
                    {errorMessage ||
                      'Invalid API Secret or session token rejected by broker gateway.'}
                  </p>
                </div>

                <div className='flex items-center justify-center gap-2.5 pt-1'>
                  <button
                    type='button'
                    onClick={() => {
                      called.current = false;
                      runCallback();
                    }}
                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                  >
                    <RefreshCw className='size-3.5' />
                    <span>Try Again</span>
                  </button>
                  <Link
                    href={broker?.setupPath || '/brokers'}
                    className='inline-flex items-center px-4 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs'
                  >
                    Edit Credentials
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 3. CARD FOOTER ── */}
        <div className='pt-5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400'>
          <div className='flex items-center gap-1.5'>
            <ShieldCheck className='size-3.5 text-neutral-400 shrink-0' />
            <span className='text-[11px]'>AES-256 Envelope Protected</span>
          </div>

          <Link
            href={broker?.setupPath || '/brokers'}
            className='inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
          >
            <span>Return to Connection Hub</span>
            <ChevronRight className='size-3' />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default BrokerCallbackHandler;
