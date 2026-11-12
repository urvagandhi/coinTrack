'use client';

import { cn } from '@/shared/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function MfInstrumentList({
  instruments = [],
  _isLoading = false,
}) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const parsePlan = inst => {
    let type = inst.schemeType || inst.scheme_type || 'Unknown';
    let plan = inst.plan || 'Regular';
    if (type && type.toLowerCase().includes('direct')) {
      plan = 'Direct';
      type = type.replace(/direct/i, '').trim();
    } else if (type && type.toLowerCase().includes('regular')) {
      plan = 'Regular';
      type = type.replace(/regular/i, '').trim();
    }
    if (type) type = type.charAt(0).toUpperCase() + type.slice(1);
    return { type, plan };
  };

  const directCount = useMemo(
    () => instruments.filter(i => parsePlan(i).plan === 'Direct').length,
    [instruments]
  );
  const regularCount = instruments.length - directCount;

  const filtered = useMemo(() => {
    if (!instruments) return [];
    let list = instruments;

    if (planFilter !== 'ALL') {
      list = list.filter(i => parsePlan(i).plan === planFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        inst =>
          (inst.name && inst.name.toLowerCase().includes(q)) ||
          (inst.amc && inst.amc.toLowerCase().includes(q)) ||
          (inst.schemeType && inst.schemeType.toLowerCase().includes(q)) ||
          (inst.tradingSymbol && inst.tradingSymbol.toLowerCase().includes(q))
      );
    }

    return list.slice(0, 60);
  }, [instruments, search, planFilter]);

  return (
    <div className='space-y-4'>
      {/* ── 1. 4 KPI CARDS ── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            AMFI Master Schemes
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block'>
            {instruments.length} Schemes
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            SEBI registered master file
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Direct Growth Plans
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block'>
            {directCount} Direct
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            Zero distributor commission
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Regular Plans
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-neutral-600 dark:text-neutral-300 block'>
            {regularCount} Regular
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            Distributor broker ledgers
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Clearing Platform
          </span>
          <span className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 block font-mono'>
            BSE StAR MF
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            Exchange order routing
          </span>
        </div>
      </div>

      {/* ── 2. SUB-BAR: PLAN FILTER & SEARCH ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1'>
        <div className='flex items-center gap-1.5 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 text-xs'>
          {[
            { id: 'ALL', label: `All (${instruments.length})` },
            { id: 'Direct', label: `Direct (${directCount})` },
            { id: 'Regular', label: `Regular (${regularCount})` },
          ].map(pill => (
            <button
              key={pill.id}
              type='button'
              onClick={() => setPlanFilter(pill.id)}
              className={cn(
                'px-2.5 py-1 rounded-md font-mono text-xs font-medium transition-colors cursor-pointer',
                planFilter === pill.id
                  ? 'bg-white dark:bg-[#16171a] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none' />
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search scheme name, AMC, symbol…'
            className='w-full pl-9 pr-8 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors font-mono'
          />
          {search && (
            <button
              type='button'
              onClick={() => setSearch('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer'
            >
              <X className='size-3' />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. SCHEMES MASTER LIST ── */}
      <section className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
        {filtered.length === 0 ? (
          <div className='py-14 text-center'>
            <Compass
              className='size-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-3'
              strokeWidth={1.5}
            />
            <p className='text-sm text-neutral-500 font-mono'>
              No mutual fund schemes match your search criteria.
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs font-mono'>
            {filtered.map((inst, i) => {
              const id = inst.tradingSymbol || inst.scheme || i;
              const isOpen = expandedId === id;
              const { type, plan } = parsePlan(inst);
              const isDirect = plan === 'Direct';

              return (
                <li key={id}>
                  <button
                    type='button'
                    onClick={() => setExpandedId(isOpen ? null : id)}
                    className='w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-850/60 transition-colors cursor-pointer'
                  >
                    <div className='flex items-center gap-3.5 min-w-0 flex-1'>
                      <span className='text-[11px] font-mono text-neutral-400 w-7 shrink-0'>
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <div className='min-w-0 flex-1 font-sans'>
                        <p className='text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1'>
                          {inst.name || inst.tradingSymbol}
                        </p>
                        <div className='flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono'>
                          <span className='font-medium text-neutral-600 dark:text-neutral-400'>
                            {inst.amc || 'Mutual Fund'}
                          </span>
                          <span>·</span>
                          <span>{type}</span>
                          <span>·</span>
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded font-bold text-[9px] uppercase',
                              isDirect
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            )}
                          >
                            {plan}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-4 shrink-0 text-right'>
                      <div>
                        <span className='text-[10px] text-neutral-400 block'>
                          NAV
                        </span>
                        <span className='font-bold text-neutral-900 dark:text-neutral-100 font-mono'>
                          {inst.lastPrice ? `₹${inst.lastPrice}` : '—'}
                        </span>
                      </div>

                      <div className='text-neutral-400'>
                        {isOpen ? (
                          <ChevronDown className='size-4 text-neutral-900 dark:text-neutral-100' />
                        ) : (
                          <ChevronRight className='size-4' />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isOpen && (
                    <div className='px-5 py-4 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-neutral-800 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-4'>
                      <div>
                        <span className='text-[10px] text-neutral-400 block uppercase'>
                          Trading Symbol
                        </span>
                        <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                          {inst.tradingSymbol || '—'}
                        </span>
                      </div>
                      <div>
                        <span className='text-[10px] text-neutral-400 block uppercase'>
                          Dividend Type
                        </span>
                        <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                          {inst.dividendType || 'Growth'}
                        </span>
                      </div>
                      <div>
                        <span className='text-[10px] text-neutral-400 block uppercase'>
                          Settlement
                        </span>
                        <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                          T+2 Days
                        </span>
                      </div>
                      <div>
                        <span className='text-[10px] text-neutral-400 block uppercase'>
                          Purchase Allowed
                        </span>
                        <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                          Yes (SIP &amp; Lumpsum)
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* ── TABLE FOOTER ── */}
        <div className='p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-neutral-500'>
          <div className='flex items-center gap-1.5'>
            <ShieldCheck className='size-4 text-emerald-500 shrink-0' />
            <span>
              AMFI mutual fund scheme master catalog · BSE StAR routing
            </span>
          </div>
          <div>
            Showing {filtered.length} of {instruments.length} schemes
          </div>
        </div>
      </section>
    </div>
  );
}
