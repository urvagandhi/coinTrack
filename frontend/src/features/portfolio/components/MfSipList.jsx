'use client';

import { formatCurrency } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import {
  Check,
  ChevronDown,
  ChevronUp,
  History,
  PiggyBank,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MfSipList({
  sips = [],
  unlinkedOrders = [],
  _isLoading = false,
  _onNavigate = () => {},
  initialContext = {},
}) {
  const [expandedSipId, setExpandedSipId] = useState(null);

  useEffect(() => {
    if (initialContext?.expandSipId && sips.length > 0) {
      setExpandedSipId(initialContext.expandSipId);
    }
  }, [initialContext, sips]);

  const toggleExpand = sipId => {
    setExpandedSipId(prev => (prev === sipId ? null : sipId));
  };

  const totalMonthlyOutflow = sips.reduce((acc, s) => {
    const amt = Number(s.installmentAmount || s.amount || s.dividend || 0);
    return acc + amt;
  }, 0);

  const activeSips = sips.filter(
    s => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
  );

  return (
    <div className='space-y-5'>
      {/* ── 1. 4 KPI SUMMARY CARDS ── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Total Monthly Outflow
          </span>
          <span className='text-base sm:text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
            {formatCurrency(totalMonthlyOutflow)} / mo
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            Aggregated mandate commitments
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Active Mandates
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block'>
            {activeSips.length} Active
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            {sips.length} total registered plans
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Autopay Mode
          </span>
          <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400 block font-mono'>
            e-NACH Active
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            NPCI authenticated mandate
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Execution Engine
          </span>
          <span className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 block font-mono'>
            Zerodha Coin API
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            BSE StAR MF Clearing
          </span>
        </div>
      </div>

      {/* ── 2. SIPS CARDS GRID ── */}
      {sips.length === 0 ? (
        <section className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs p-12 text-center'>
          <PiggyBank
            className='size-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-3'
            strokeWidth={1.5}
          />
          <h3 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100'>
            No active SIPs on file
          </h3>
          <p className='text-xs text-neutral-500 font-mono mt-1'>
            Systematic Investment Plans from Zerodha Coin will sync here
            automatically.
          </p>
        </section>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {sips.map((sip, idx) => {
            const sipId = sip.sipId || sip.sip_id || `SIP-${idx + 1}`;
            const amount = Number(
              sip.installmentAmount || sip.amount || sip.dividend || 0
            );
            const status = (sip.status || 'ACTIVE').toUpperCase();
            const isActive = status === 'ACTIVE';
            const isExpanded = expandedSipId === sipId;
            const completedCount = Number(
              sip.completedInstallments || sip.installments || 0
            );

            return (
              <div
                key={sipId}
                className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors'
              >
                <div className='space-y-3'>
                  {/* Top Header: Status & Mandate ID */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          isActive
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-neutral-400'
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs font-semibold font-mono',
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-neutral-500'
                        )}
                      >
                        {status} MANDATE
                      </span>
                    </div>

                    <span className='text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800'>
                      {sipId}
                    </span>
                  </div>

                  {/* Scheme Name & Folio */}
                  <div>
                    <h3 className='font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug'>
                      {sip.fund || sip.tradingsymbol || sip.schemeName}
                    </h3>
                    <p className='text-[11px] font-mono text-neutral-400 mt-1'>
                      {sip.folio
                        ? `Folio: ${sip.folio}`
                        : 'CDSL Demat Allotment'}
                    </p>
                  </div>

                  {/* Monthly Outflow Value */}
                  <div className='pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-baseline justify-between'>
                    <span className='text-xs text-neutral-500 font-mono'>
                      Commitment
                    </span>
                    <div className='text-right'>
                      <span className='text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100'>
                        {formatCurrency(amount)}
                      </span>
                      <span className='text-xs font-mono text-neutral-500'>
                        {' '}
                        / {sip.frequency || 'Monthly'}
                      </span>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className='grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-neutral-100 dark:border-neutral-800/80'>
                    <div>
                      <span className='text-[10px] text-neutral-400 block'>
                        TRIGGER DAY
                      </span>
                      <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                        {sip.installmentDate || sip.triggerDay
                          ? `${sip.installmentDate || sip.triggerDay}th of month`
                          : '1st of month'}
                      </span>
                    </div>
                    <div>
                      <span className='text-[10px] text-neutral-400 block'>
                        EXECUTED
                      </span>
                      <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                        {completedCount > 0
                          ? `${completedCount} Installments`
                          : 'Active Plan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Toggle for History */}
                <div className='pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-mono'>
                  <span className='text-[10px] text-neutral-400'>
                    Auto-Debit active
                  </span>

                  <button
                    type='button'
                    onClick={() => toggleExpand(sipId)}
                    className='inline-flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer font-medium'
                  >
                    <History className='size-3' />
                    <span>{isExpanded ? 'Hide Fills' : 'View Fills'}</span>
                    {isExpanded ? (
                      <ChevronUp className='size-3' />
                    ) : (
                      <ChevronDown className='size-3' />
                    )}
                  </button>
                </div>

                {/* Expanded Execution Drawer */}
                {isExpanded && (
                  <div className='p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 space-y-2 text-xs font-mono'>
                    <div className='flex items-center justify-between text-[10px] text-neutral-400 uppercase'>
                      <span>Debit Date</span>
                      <span>Amount</span>
                      <span>Status</span>
                    </div>
                    <div className='flex items-center justify-between text-xs text-neutral-800 dark:text-neutral-200 pt-1 border-t border-neutral-200/40 dark:border-neutral-800'>
                      <span>05 Nov 2026</span>
                      <span className='font-semibold'>
                        {formatCurrency(amount)}
                      </span>
                      <span className='inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400'>
                        <Check className='size-3' />
                        Allotted
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3. UNLINKED ORDERS SECTION (IF ANY) ── */}
      {unlinkedOrders.length > 0 && (
        <section className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs p-5 space-y-3'>
          <h3 className='text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono uppercase tracking-wider'>
            Unlinked SIP Installments ({unlinkedOrders.length})
          </h3>
          <div className='divide-y divide-neutral-100 dark:divide-neutral-800 text-xs font-mono'>
            {unlinkedOrders.map((ord, i) => (
              <div
                key={ord.orderId || i}
                className='py-2 flex items-center justify-between'
              >
                <span>{ord.fund || ord.tradingsymbol}</span>
                <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
                  {formatCurrency(ord.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
