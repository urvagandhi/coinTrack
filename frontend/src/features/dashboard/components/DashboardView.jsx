'use client';

import { usePortfolioSummary } from '@/features/portfolio';
import { useAuth } from '@/shared/auth/AuthContext';
import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { BrokerStatusBanner } from '@/widgets/broker-status-banner';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  Flame,
  History,
  PieChart,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { HoldingsTable } from './HoldingsTable';

export function DashboardView() {
  const { user } = useAuth();
  const { data: summary, isLoading: isSummaryLoading } = usePortfolioSummary();
  const [timeRange, setTimeRange] = useState('30D');
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const firstName = user?.name?.split(' ')[0] || user?.username || 'Investor';

  const totalValue = summary?.totalCurrentValue || 0;
  const investedValue = summary?.totalInvestedValue || 0;
  const dayGain = summary?.totalDayGain || 0;
  const dayGainPercent = summary?.totalDayGainPercent || 0;
  const unrealizedPL = summary?.totalUnrealizedPL || 0;
  const unrealizedPLPercent = summary?.totalUnrealizedPLPercent || 0;

  const isDayPositive = dayGain >= 0;
  const isPLPositive = unrealizedPL >= 0;

  // Monthly timeline mock for net worth vs invested chart
  const monthlyData = [
    { month: 'Jan', messenger: 1400, sales: 2400, renewals: 1200 },
    { month: 'Feb', messenger: 1550, sales: 2600, renewals: 1400 },
    { month: 'Mar', messenger: 1700, sales: 2900, renewals: 1500 },
    { month: 'Apr', messenger: 1650, sales: 3100, renewals: 1700 },
    { month: 'May', messenger: 1900, sales: 3400, renewals: 1900 },
    {
      month: 'Jun',
      messenger: 2100,
      sales: 3800,
      renewals: 2100,
      active: true,
    },
    { month: 'Jul', messenger: 2000, sales: 3600, renewals: 2000 },
    { month: 'Aug', messenger: 2200, sales: 4100, renewals: 2200 },
    { month: 'Sep', messenger: 2350, sales: 4300, renewals: 2400 },
    {
      month: 'Oct',
      messenger: 2500,
      sales: 4700,
      renewals: 2600,
      projected: true,
    },
  ];

  return (
    <div className='w-full pb-8 md:pb-12'>
      {/* ── OVERVIEW SECTION HEADER ── */}
      <section className='pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
            Portfolio overview
          </h1>
          <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1'>
            Real-time signals and consolidated valuations for {firstName}&apos;s
            ledgers.
          </p>
        </div>

        <div className='flex items-center gap-2.5 self-start md:self-auto flex-wrap'>
          <button
            type='button'
            onClick={() =>
              setTimeRange(prev =>
                prev === '30D' ? '7D' : prev === '7D' ? '1Y' : '30D'
              )
            }
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors'
          >
            <History className='size-3.5 text-neutral-400' />
            <span>{timeRange}</span>
            <ChevronDown className='size-3 text-neutral-400' />
          </button>

          <button
            type='button'
            onClick={() => window.print()}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
          >
            <Download className='size-3.5 text-neutral-400' />
            <span>Export</span>
          </button>

          <Link
            href='/portfolio'
            className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm'
          >
            <Share2 className='size-3.5' />
            <span>Quick Sync</span>
          </Link>
        </div>
      </section>

      {/* ── 4 KPI METRICS ROW ── */}
      <section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2 pb-6'>
        {/* 1: Total Portfolio Value */}
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
            <Flame className='size-3.5 text-orange-500' />
            <span>Total Net Worth</span>
          </div>
          <div className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
            {isSummaryLoading ? '...' : formatCurrency(totalValue)}
          </div>
          <div className='flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
            <ArrowUpRight className='size-3.5' />
            <span>{formatPercent(unrealizedPLPercent)} all-time</span>
          </div>
        </div>

        {/* 2: Today's P&L */}
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
            <History className='size-3.5 text-blue-500' />
            <span>Today&apos;s Return</span>
          </div>
          <div
            className={cn(
              'text-2xl sm:text-3xl font-bold tracking-tight',
              isDayPositive
                ? 'text-foreground'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isSummaryLoading
              ? '...'
              : `${isDayPositive ? '+' : ''}${formatCurrency(dayGain)}`}
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              isDayPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isDayPositive ? (
              <ArrowUpRight className='size-3.5' />
            ) : (
              <ArrowDownRight className='size-3.5' />
            )}
            <span>
              {Math.abs(dayGainPercent) < 0.01
                ? '< 0.01%'
                : formatPercent(dayGainPercent)}{' '}
              since open
            </span>
          </div>
        </div>

        {/* 3: Unrealized Profit / Loss */}
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
            <TrendingUp className='size-3.5 text-emerald-500' />
            <span>Unrealized Gain</span>
          </div>
          <div
            className={cn(
              'text-2xl sm:text-3xl font-bold tracking-tight',
              isPLPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isSummaryLoading
              ? '...'
              : `${isPLPositive ? '+' : ''}${formatCurrency(unrealizedPL)}`}
          </div>
          <div className='flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
            <ArrowUpRight className='size-3.5' />
            <span>12.4% vs benchmark</span>
          </div>
        </div>

        {/* 4: Invested Capital */}
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
            <PieChart className='size-3.5 text-indigo-500' />
            <span>Invested Capital</span>
          </div>
          <div className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
            {isSummaryLoading ? '...' : formatCurrency(investedValue)}
          </div>
          <div className='flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400'>
            <span>Across 6 asset classes</span>
          </div>
        </div>
      </section>

      {/* ── MULTI-COLOR ALLOCATION BAR ── */}
      <section className='pb-8'>
        <div className='w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex overflow-hidden gap-0.5 p-0.5'>
          <div
            className='h-full bg-blue-600 rounded-l-full'
            style={{ width: '38%' }}
            title='Equities: 38%'
          />
          <div
            className='h-full bg-orange-500'
            style={{ width: '28%' }}
            title='Mutual Funds: 28%'
          />
          <div
            className='h-full bg-emerald-500'
            style={{ width: '20%' }}
            title='Gold & Silver: 20%'
          />
          <div
            className='h-full bg-indigo-500/80 rounded-r-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:8px_8px]'
            style={{ width: '14%' }}
            title='EPF & Fixed Income: 14%'
          />
        </div>
      </section>

      {/* ── TWO-COLUMN MAIN CONTENT GRID ── */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Column (2/3 width): Performance vs Invested + Holdings */}
        <div className='lg:col-span-2 space-y-8'>
          {/* Net Worth vs Invested Chart Card */}
          <div className='rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-5 sm:p-6 bg-neutral-50/50 dark:bg-neutral-900/40'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6'>
              <div>
                <h3 className='text-base font-bold text-foreground'>
                  Net worth vs. invested
                </h3>
                <div className='flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5'>
                  <ArrowUpRight className='size-3.5' />
                  <span>+18.4% growth across all quarters</span>
                </div>
              </div>

              <div className='flex items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400'>
                <div className='flex items-center gap-1.5'>
                  <span className='size-2.5 rounded-full bg-blue-600' />
                  <span>Equities</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='size-2.5 rounded-full bg-orange-500' />
                  <span>Mutual Funds</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='size-2.5 rounded-full bg-emerald-500' />
                  <span>Other</span>
                </div>
              </div>
            </div>

            {/* Bar visualization */}
            <div className='h-48 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-2'>
              {monthlyData.map((item, index) => {
                const isHovered = hoveredMonth === index;
                const isJun = item.month === 'Jun';

                return (
                  <div
                    key={item.month}
                    onMouseEnter={() => setHoveredMonth(index)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className='flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative'
                  >
                    {/* Active tooltip popover */}
                    {(isHovered || isJun) && (
                      <div className='absolute -top-10 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold shadow-lg pointer-events-none flex items-center gap-1.5 z-20 whitespace-nowrap animate-in fade-in zoom-in-95'>
                        <span className='size-1.5 rounded-full bg-orange-500' />
                        <span>₹{(item.sales * 12).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Stacked bar elements */}
                    <div className='w-full max-w-[36px] flex flex-col gap-1 items-center'>
                      {/* Top segment */}
                      <div
                        className={cn(
                          'w-full rounded-sm transition-all duration-300',
                          item.projected
                            ? 'bg-neutral-300/60 dark:bg-neutral-700/60 h-28 border border-dashed border-neutral-400/60'
                            : 'bg-orange-500 h-2.5 group-hover:scale-y-110'
                        )}
                      />
                      {/* Bottom segment */}
                      {!item.projected && (
                        <div
                          className={cn(
                            'w-full rounded-sm transition-all duration-300',
                            isJun
                              ? 'bg-blue-600 h-6 ring-2 ring-blue-500/30'
                              : 'bg-blue-500/80 h-5 group-hover:scale-y-110'
                          )}
                        />
                      )}
                    </div>

                    {/* Month label */}
                    <span
                      className={cn(
                        'text-[11px] font-medium mt-3 transition-colors',
                        isJun
                          ? 'font-bold text-foreground'
                          : 'text-neutral-400 group-hover:text-foreground'
                      )}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Broker alert & Holdings Table */}
          <BrokerStatusBanner />
          <HoldingsTable />
        </div>

        {/* Right Column (1/3 width): AI Assistant & Portfolio Quality */}
        <div className='space-y-6'>
          {/* Top AI / Suggestion Bubble card */}
          <div className='rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-5 sm:p-6 bg-neutral-50/70 dark:bg-neutral-900/50 flex flex-col gap-4'>
            {/* Message bubble 1 */}
            <div className='self-end max-w-[85%] bg-white dark:bg-neutral-800 rounded-2xl rounded-tr-sm p-3 text-xs text-neutral-800 dark:text-neutral-200 shadow-sm border border-black/[0.04] dark:border-white/[0.04]'>
              Equity portfolio is outperforming NIFTY 50 by 2.4% this quarter.
            </div>

            {/* Message bubble 2 */}
            <div className='self-end max-w-[85%] bg-white dark:bg-neutral-800 rounded-2xl rounded-tr-sm p-3 text-xs text-neutral-800 dark:text-neutral-200 shadow-sm border border-black/[0.04] dark:border-white/[0.04]'>
              SIP deduction of ₹15,000 recorded in Mutual Funds ledger.
            </div>

            {/* Message bubble 3: Generating state */}
            <div className='self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 shadow-sm border border-black/[0.04] dark:border-white/[0.04]'>
              <Sparkles className='size-3 text-blue-500 animate-spin' />
              <span>AI rebalancing ready...</span>
            </div>

            <div className='pt-3 border-t border-black/[0.06] dark:border-white/[0.06]'>
              <h4 className='text-xs font-bold text-foreground mb-1'>
                AI allocation suggestions
              </h4>
              <p className='text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed'>
                Your equity allocation is currently 66% against your defensive
                target of 50%. Consider topping up EPF or short-duration debt
                mutual funds.
              </p>
            </div>
          </div>

          {/* Portfolio Health & Quality Gauge Card */}
          <div className='rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-5 sm:p-6 bg-neutral-50/70 dark:bg-neutral-900/50'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-sm font-bold text-foreground'>
                Portfolio health score
              </h4>
              <span className='text-xs text-neutral-400'>•••</span>
            </div>

            {/* Semi-circle SVG speedometer gauge */}
            <div className='relative flex flex-col items-center justify-center pt-2 pb-4'>
              <svg className='w-48 h-28 overflow-visible' viewBox='0 0 100 55'>
                {/* Gauge background track */}
                <path
                  d='M 10 50 A 40 40 0 0 1 90 50'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='8'
                  strokeLinecap='round'
                  className='text-neutral-200 dark:text-neutral-800'
                />
                {/* Gauge active gradient arc */}
                <path
                  d='M 10 50 A 40 40 0 0 1 90 50'
                  fill='none'
                  stroke='url(#gauge-gradient)'
                  strokeWidth='8'
                  strokeDasharray='126'
                  strokeDashoffset='22'
                  strokeLinecap='round'
                />
                <defs>
                  <linearGradient
                    id='gauge-gradient'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='0%'
                  >
                    <stop offset='0%' stopColor='#2563eb' />
                    <stop offset='50%' stopColor='#06b6d4' />
                    <stop offset='100%' stopColor='#10b981' />
                  </linearGradient>
                </defs>
              </svg>

              {/* Score centered in the arc */}
              <div className='text-center -mt-6'>
                <div className='text-2xl font-bold tracking-tight text-foreground'>
                  880
                </div>
                <div className='text-[10px] uppercase font-mono tracking-widest text-neutral-400'>
                  Optimal Health
                </div>
              </div>
            </div>

            <div className='text-center text-[11px] text-neutral-500 dark:text-neutral-400 px-2'>
              Consolidated risk index rated exceptional across volatility, asset
              dispersion, and liquidity reserves.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
