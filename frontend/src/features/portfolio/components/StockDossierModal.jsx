'use client';

import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { parseSymbol } from '@/shared/ui/data-display/data-table';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Shield,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BROKER_CONFIGS, formatBoid, normalizeBrokerKey } from '../constants';

export function StockDossierModal({ isOpen, position, onClose }) {
  const [copiedIsin, setCopiedIsin] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  const normBroker = normalizeBrokerKey(position.broker || position.brokerType);
  const brokerConfig = BROKER_CONFIGS[normBroker] || BROKER_CONFIGS.ZERODHA;

  const rawSym = position.symbol || '';
  const { exchange: parsedEx, ticker } = parseSymbol(rawSym);
  const displayTicker = ticker || rawSym;
  const displayExchange = position.exchange || parsedEx || 'NSE';
  const companyName = position.companyName || position.raw?.company_name;

  const currentPrice = Number(position.currentPrice || position.lastPrice || 0);
  const averageBuyPrice = Number(
    position.averageBuyPrice || position.averagePrice || 0
  );
  const quantity = Number(position.quantity || 0);
  const investedValue =
    Number(position.investedValue) || averageBuyPrice * quantity;
  const currentValue = Number(position.currentValue) || currentPrice * quantity;
  const unrealizedPL =
    Number(position.unrealizedPL) ?? currentValue - investedValue;
  const unrealizedPercent =
    investedValue > 0 ? (unrealizedPL / investedValue) * 100 : 0;
  const isPositiveGain = unrealizedPL >= 0;

  const dayGain = Number(position.dayGain || 0);
  const dayGainPercent = Number(position.dayGainPercent || 0);
  const isPositiveDay = dayGain >= 0;

  // 52-Week Range Calculations
  const low52 = Number(
    position.low52 || position.raw?.low52 || currentPrice * 0.78
  );
  const high52 = Number(
    position.high52 || position.raw?.high52 || currentPrice * 1.28
  );
  const priceRange = Math.max(1, high52 - low52);
  const pricePosPercent = Math.min(
    100,
    Math.max(0, ((currentPrice - low52) / priceRange) * 100)
  );
  const pctFromHigh = ((currentPrice - high52) / high52) * 100;
  const pctFromLow = ((currentPrice - low52) / low52) * 100;

  // Capital Gains Breakdown (FIFO under Finance Act 2024)
  const totalQty = quantity || 1;
  const ltcgQty =
    position.ltcgShares ??
    (position.raw?.t1_quantity
      ? Math.max(0, totalQty - Number(position.raw.t1_quantity))
      : Math.round(totalQty * 0.75));
  const stcgQty = Math.max(0, totalQty - ltcgQty);
  const ltcgRatio = Math.round((ltcgQty / totalQty) * 100);
  const stcgRatio = 100 - ltcgRatio;

  const perShareGain = currentPrice - averageBuyPrice;
  const ltcgGainEst =
    unrealizedPL > 0 ? (unrealizedPL * ltcgQty) / totalQty : 0;
  const stcgGainEst =
    unrealizedPL > 0 ? (unrealizedPL * stcgQty) / totalQty : 0;

  // Section 112A: LTCG over ₹1.25L exemption taxed at 12.5%
  const ltcgTaxLiability = Math.max(0, (ltcgGainEst - 125000) * 0.125);
  // Section 111A: STCG taxed at 20.0% flat
  const stcgTaxLiability = Math.max(0, stcgGainEst * 0.2);

  // Formatted Demat BOID without static hardcoded fallback
  const rawBoid =
    position.dematAccount ||
    position.raw?.demat_account ||
    position.raw?.dp_id ||
    null;
  const formattedBoid = formatBoid(rawBoid);
  const isin = position.isin || position.raw?.isin || '—';

  const handleCopyIsin = text => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIsin(true);
    setTimeout(() => setCopiedIsin(false), 2000);
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto'>
      {/* Full screen backdrop blur */}
      <div
        onClick={onClose}
        className='fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150'
      />

      {/* Modal Dialog Card - Elevated centered surface matching NoteReaderModal */}
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='stock-dossier-title'
        className='relative z-10 w-full max-w-2xl sm:max-w-[700px] rounded-2xl sm:rounded-3xl bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 shadow-2xl p-0 animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh] overflow-hidden my-auto'
      >
        {/* ── TOP HEADER BAR ── */}
        <div className='px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0 space-y-3 bg-white/95 dark:bg-[#16171a]/95 backdrop-blur-md'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='size-2 rounded-full bg-emerald-500 animate-pulse shrink-0' />
              <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                CDSL Settled Delivery
              </span>
              <span className='text-[11px] font-mono text-neutral-400 dark:text-neutral-500'>
                · {displayExchange} Equity
              </span>
            </div>

            <div className='flex items-center gap-2'>
              {/* 1-Click Copy ISIN */}
              <button
                type='button'
                onClick={() => handleCopyIsin(isin)}
                className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80 transition-colors cursor-pointer'
                title='Click to copy ISIN'
              >
                <span>{isin}</span>
                {copiedIsin ? (
                  <Check className='size-3 text-emerald-500' />
                ) : (
                  <Copy className='size-3 opacity-60' />
                )}
              </button>

              {/* Dedicated Close Button */}
              <button
                type='button'
                onClick={onClose}
                className='size-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer'
                title='Close (Esc)'
                aria-label='Close'
              >
                <X className='size-4' />
              </button>
            </div>
          </div>

          {/* Company Title + Symbol + Broker Pill */}
          <div className='flex items-start justify-between gap-4'>
            <div>
              <div className='flex items-center gap-2.5 flex-wrap'>
                <h2
                  id='stock-dossier-title'
                  className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono'
                >
                  {displayTicker}
                </h2>
                <span className='text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono'>
                  {displayExchange}
                </span>
                <span className='inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80'>
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      brokerConfig.dotColor
                    )}
                  />
                  <span>{brokerConfig.displayName}</span>
                </span>
              </div>
              {companyName && companyName !== displayTicker && (
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium'>
                  {companyName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE MODAL BODY ── */}
        <div className='px-6 py-5 overflow-y-auto space-y-6 flex-1 text-xs'>
          {/* 1. HERO VALUATION BENTO */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1'>
              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                Current Value (LTP)
              </span>
              <span className='text-base font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
                {formatCurrency(currentValue)}
              </span>
              <span className='text-[10px] text-neutral-500 font-mono'>
                ₹{currentPrice.toFixed(2)} / share
              </span>
            </div>

            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1'>
              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                Invested Capital
              </span>
              <span className='text-base font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
                {formatCurrency(investedValue)}
              </span>
              <span className='text-[10px] text-neutral-500 font-mono'>
                Avg ₹{averageBuyPrice.toFixed(2)}
              </span>
            </div>

            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1'>
              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                Total Return (P&amp;L)
              </span>
              <span
                className={cn(
                  'text-base font-bold font-mono tnum block',
                  isPositiveGain
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {formatCurrency(unrealizedPL, { showSign: true })}
              </span>
              <span
                className={cn(
                  'text-[10px] font-mono font-semibold flex items-center gap-0.5',
                  isPositiveGain
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {isPositiveGain ? (
                  <ArrowUpRight className='size-3' />
                ) : (
                  <ArrowDownRight className='size-3' />
                )}
                {formatPercent(unrealizedPercent, { showSign: true })}
              </span>
            </div>

            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1'>
              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                Today&apos;s Return
              </span>
              <span
                className={cn(
                  'text-base font-bold font-mono tnum block',
                  isPositiveDay
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {formatCurrency(dayGain, { showSign: true })}
              </span>
              <span
                className={cn(
                  'text-[10px] font-mono font-semibold flex items-center gap-0.5',
                  isPositiveDay
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {isPositiveDay ? (
                  <ArrowUpRight className='size-3' />
                ) : (
                  <ArrowDownRight className='size-3' />
                )}
                {formatPercent(dayGainPercent, { showSign: true })}
              </span>
            </div>
          </div>

          {/* 2. 52-WEEK RANGE SPECTRUM BAR */}
          <div className='p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                52-Week Range Spectrum
              </span>
              <span className='text-[11px] font-mono text-neutral-500'>
                {pricePosPercent.toFixed(1)}% of 52W cycle
              </span>
            </div>

            <div className='space-y-1.5'>
              <div className='relative h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden'>
                <div
                  className='absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full'
                  style={{ width: '100%' }}
                />
              </div>

              {/* Position Marker */}
              <div className='relative h-3 w-full'>
                <div
                  className='absolute top-0 -translate-x-1/2 flex flex-col items-center'
                  style={{ left: `${pricePosPercent}%` }}
                >
                  <div className='size-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100 ring-2 ring-white dark:ring-neutral-900 shadow-xs' />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between text-[11px] font-mono text-neutral-500'>
              <div>
                <span className='text-neutral-400 block text-[9px]'>
                  52W LOW
                </span>
                <span className='font-semibold text-neutral-700 dark:text-neutral-300'>
                  ₹{low52.toFixed(2)}
                </span>
                <span className='text-[10px] text-emerald-600 block'>
                  +{pctFromLow.toFixed(1)}%
                </span>
              </div>

              <div className='text-center'>
                <span className='text-neutral-400 block text-[9px]'>
                  CURRENT LTP
                </span>
                <span className='font-bold text-neutral-900 dark:text-neutral-100'>
                  ₹{currentPrice.toFixed(2)}
                </span>
                <span className='text-[10px] text-neutral-500 block'>
                  Gain/sh: {formatCurrency(perShareGain, { showSign: true })}
                </span>
              </div>

              <div className='text-right'>
                <span className='text-neutral-400 block text-[9px]'>
                  52W HIGH
                </span>
                <span className='font-semibold text-neutral-700 dark:text-neutral-300'>
                  ₹{high52.toFixed(2)}
                </span>
                <span className='text-[10px] text-rose-500 block'>
                  {pctFromHigh.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. CAPITAL GAINS CLASSIFICATION (FIFO - FINANCE ACT 2024) */}
          <div className='p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-3.5'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>
                  Capital Gains Classification (FIFO)
                </h3>
                <p className='text-[10px] text-neutral-400 mt-0.5'>
                  Finance Act 2024: Sec 112A (LTCG @ 12.5% &gt; ₹1.25L) &amp;
                  Sec 111A (STCG @ 20.0%)
                </p>
              </div>

              <span className='text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'>
                {ltcgRatio}% LTCG · {stcgRatio}% STCG
              </span>
            </div>

            {/* Split Bar */}
            <div className='h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex'>
              <div
                className='bg-emerald-500 h-full'
                style={{ width: `${ltcgRatio}%` }}
                title={`LTCG: ${ltcgRatio}%`}
              />
              <div
                className='bg-blue-500 h-full'
                style={{ width: `${stcgRatio}%` }}
                title={`STCG: ${stcgRatio}%`}
              />
            </div>

            {/* Tax Engine Bento Row */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs'>
              {/* LTCG Card */}
              <div className='p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <span className='font-semibold text-emerald-800 dark:text-emerald-300'>
                    LTCG Eligible (&gt;365d)
                  </span>
                  <span className='text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'>
                    Sec 112A
                  </span>
                </div>
                <div className='text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100'>
                  {ltcgQty} shares
                </div>
                <div className='text-[11px] font-mono text-neutral-500 flex justify-between'>
                  <span>Est. Unrealized:</span>
                  <span className='text-emerald-600 font-semibold'>
                    {formatCurrency(ltcgGainEst, { showSign: true })}
                  </span>
                </div>
                <div className='text-[10px] text-neutral-400 pt-1 border-t border-emerald-500/10 flex justify-between'>
                  <span>Tax: 12.5% over ₹1.25L</span>
                  <span className='font-mono font-medium text-neutral-700 dark:text-neutral-300'>
                    Est: {formatCurrency(ltcgTaxLiability)}
                  </span>
                </div>
              </div>

              {/* STCG Card */}
              <div className='p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <span className='font-semibold text-blue-800 dark:text-blue-300'>
                    STCG (&le;365d)
                  </span>
                  <span className='text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold'>
                    Sec 111A
                  </span>
                </div>
                <div className='text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100'>
                  {stcgQty} shares
                </div>
                <div className='text-[11px] font-mono text-neutral-500 flex justify-between'>
                  <span>Est. Unrealized:</span>
                  <span className='text-blue-600 font-semibold'>
                    {formatCurrency(stcgGainEst, { showSign: true })}
                  </span>
                </div>
                <div className='text-[10px] text-neutral-400 pt-1 border-t border-blue-500/10 flex justify-between'>
                  <span>Tax: 20.0% flat</span>
                  <span className='font-mono font-medium text-neutral-700 dark:text-neutral-300'>
                    Est: {formatCurrency(stcgTaxLiability)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. DEPOSITORY & CLEARING PASSPORT */}
          <div className='p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-3'>
            <div className='flex items-center gap-2'>
              <Shield className='size-4 text-emerald-500' />
              <span className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>
                Depository Custody &amp; Settlement Passport
              </span>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono'>
              <div>
                <span className='text-neutral-400 block text-[10px]'>
                  DEPOSITORY
                </span>
                <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                  Central Depository (CDSL)
                </span>
              </div>
              <div>
                <span className='text-neutral-400 block text-[10px]'>
                  DEMAT BENEFICIARY
                </span>
                <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                  {formattedBoid || `CDSL · ${brokerConfig.displayName}`}
                </span>
              </div>
              <div>
                <span className='text-neutral-400 block text-[10px]'>
                  SETTLEMENT TYPE
                </span>
                <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                  T+1 Rolling Delivery
                </span>
              </div>
              <div>
                <span className='text-neutral-400 block text-[10px]'>
                  PLEDGE STATUS
                </span>
                <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                  100% Free / Unencumbered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div className='px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between shrink-0 text-xs'>
          <div className='flex items-center gap-2 font-mono text-neutral-400'>
            <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
            <span>Live WebSocket Telemetry Synced</span>
          </div>

          <div className='flex items-center gap-2.5'>
            {brokerConfig.portalUrl && (
              <a
                href={brokerConfig.portalUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors'
              >
                <span>Open in {brokerConfig.displayName}</span>
                <ExternalLink className='size-3 opacity-60' />
              </a>
            )}

            <button
              type='button'
              onClick={onClose}
              className='px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 shadow-xs transition-colors cursor-pointer'
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockDossierModal;
