'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  Coins,
  Home,
  Landmark,
  LayoutGrid,
  Link2,
  PieChart,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  StickyNote,
  TrendingUp,
  User,
} from 'lucide-react';
import { Button } from '@/shared/ui/primitives/button';

const TOP_ASSET_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'stocks', label: 'Stocks', icon: TrendingUp, badge: 'Live' },
  { id: 'mutual-funds', label: 'Mutual Funds', icon: PieChart },
  { id: 'pf-ledgers', label: 'PF Ledgers', icon: Landmark },
  { id: 'gold-silver', label: 'Gold & Silver', icon: Coins },
];

const TIMELINE_DATA = [
  { month: 'Nov', netWorth: 3420000, invested: 2950000, delta: 470000 },
  { month: 'Dec', netWorth: 3680000, invested: 3080000, delta: 600000 },
  { month: 'Jan', netWorth: 3850000, invested: 3200000, delta: 650000 },
  { month: 'Feb', netWorth: 4120000, invested: 3340000, delta: 780000 },
  { month: 'Mar', netWorth: 4390000, invested: 3480000, delta: 910000 },
  { month: 'Apr', netWorth: 4610000, invested: 3580000, delta: 1030000 },
  {
    month: 'May',
    netWorth: 4824190,
    invested: 3683900,
    delta: 1140290,
    active: true,
  },
];

const HOLDINGS_PREVIEW = [
  {
    symbol: 'RELIANCE',
    broker: 'Zerodha',
    brokerDot: 'bg-blue-500',
    qty: 60,
    ltp: '₹2,980.40',
    value: '₹1,78,824',
    pnl: '+₹24,800',
    pnlPct: '+16.1%',
    isUp: true,
  },
  {
    symbol: 'HDFCBANK',
    broker: 'Upstox',
    brokerDot: 'bg-purple-500',
    qty: 120,
    ltp: '₹1,642.10',
    value: '₹1,97,052',
    pnl: '+₹18,420',
    pnlPct: '+10.3%',
    isUp: true,
  },
  {
    symbol: 'PPFAS Flexi Cap',
    broker: 'Direct NAV',
    brokerDot: 'bg-emerald-500',
    qty: 2450,
    ltp: '₹74.20',
    value: '₹1,81,790',
    pnl: '+₹41,200',
    pnlPct: '+29.3%',
    isUp: true,
  },
];

export function CoinTrackHeroMockup() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeRange, setActiveRange] = useState('6M');
  const [hoveredPoint, setHoveredPoint] = useState(TIMELINE_DATA.length - 1);
  const [shareToast, setShareToast] = useState(false);

  const handleShare = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2400);
  };

  // SVG Coordinates for the Wealth Curve
  const width = 560;
  const height = 180;
  const padX = 35;
  const topY = 20;
  const zeroY = 125;
  const bottomY = 168;

  const maxVal = 5500000;
  const minDelta = -600000;

  const getX = index =>
    padX + (index * (width - 2 * padX)) / (TIMELINE_DATA.length - 1);
  const getYNetWorth = val => zeroY - (val / maxVal) * (zeroY - topY);
  const getYInvested = val => zeroY - (val / maxVal) * (zeroY - topY);
  const getYDelta = val =>
    zeroY + (Math.abs(val) / Math.abs(minDelta)) * (bottomY - zeroY);

  const netWorthPoints = TIMELINE_DATA.map(
    (d, i) => `${getX(i)},${getYNetWorth(d.netWorth)}`
  );
  const investedPoints = TIMELINE_DATA.map(
    (d, i) => `${getX(i)},${getYInvested(d.invested)}`
  );
  const deltaPoints = TIMELINE_DATA.map(
    (d, i) => `${getX(i)},${getYDelta(d.delta)}`
  );

  const activeData =
    hoveredPoint !== null
      ? TIMELINE_DATA[hoveredPoint]
      : TIMELINE_DATA[TIMELINE_DATA.length - 1];

  return (
    <div className='w-full max-w-5xl mx-auto rounded-2xl min-[400px]:rounded-[32px] md:rounded-[40px] bg-white dark:bg-[#121316] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_30px_90px_-20px_rgba(15,23,42,0.16)] p-3 min-[400px]:p-4 sm:p-6 md:p-8 text-neutral-900 dark:text-neutral-100 transition-all relative overflow-hidden'>
      {/* Toast Alert */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2'
          >
            <CheckCircle2 className='size-3.5 text-emerald-400 dark:text-emerald-600' />
            <span>Live portfolio link copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP HEADER SHELL NAVIGATION (Matching Header.jsx) ── */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800/80'>
        {/* Asset Segmented Pill */}
        <div className='flex items-center gap-1 overflow-x-auto p-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-800 shrink-0 scrollbar-none max-w-full'>
          {TOP_ASSET_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId='active-mockup-tab'
                    className='absolute inset-0 bg-neutral-950 dark:bg-neutral-800 rounded-full'
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className='relative z-10 flex items-center gap-1.5'>
                  <Icon className='size-3.5' />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className='text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Profile Utilities */}
        <div className='flex items-center gap-2.5 self-end lg:self-auto'>
          <div className='relative hidden sm:block'>
            <Search className='size-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2' />
            <input
              type='text'
              readOnly
              placeholder='Search holdings, folios...'
              className='pl-8 pr-3 py-1.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 w-48 md:w-56 focus:outline-none'
            />
          </div>

          <div className='size-8 rounded-full border border-neutral-200/70 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400'>
            <Bell className='size-3.5' />
          </div>

          <div className='size-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-bold flex items-center justify-center shadow-2xs'>
            CT
          </div>
        </div>
      </div>

      {/* ── MAIN BODY: LEFT SLIM DOCK + CENTER MASTER VIEW ── */}
      <div className='pt-5 flex flex-col md:flex-row gap-5 items-start'>
        {/* Left Floating Dock (Matching Sidebar.jsx) */}
        <div className='hidden xl:flex flex-col items-center gap-3.5 py-3.5 px-1.5 rounded-full bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200/70 dark:border-neutral-700/60 shrink-0 shadow-2xs'>
          <button
            type='button'
            className='size-7 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shadow-xs'
            title='Dashboard'
          >
            <Home className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors'
            title='Notes'
          >
            <StickyNote className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors'
            title='Profile & 2FA'
          >
            <User className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors'
            title='Brokers'
          >
            <Link2 className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-300 flex items-center justify-center transition-colors'
            title='Calculators'
          >
            <SlidersHorizontal className='size-3.5' />
          </button>
        </div>

        {/* Center Main Wealth Terminal */}
        <div className='flex-1 min-w-0 space-y-5 w-full'>
          {/* Header Row */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <span className='size-2 rounded-full bg-emerald-500 animate-pulse shrink-0' />
                <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                  Feeds Live
                </span>
                <span className='text-neutral-300 dark:text-neutral-700'>
                  ·
                </span>
                <span className='text-xs text-neutral-500 dark:text-neutral-400 font-mono'>
                  Zerodha · Upstox · Angel One
                </span>
              </div>
              <h3 className='font-display font-bold text-xl sm:text-2xl text-neutral-950 dark:text-white tracking-tight leading-tight'>
                Consolidated wealth
              </h3>
            </div>

            {/* Actions: Time Range & Share */}
            <div className='flex items-center gap-2 self-start sm:self-auto'>
              <div className='inline-flex items-center p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60'>
                {['1M', '6M', '1Y', 'ALL'].map(range => (
                  <button
                    key={range}
                    type='button'
                    onClick={() => setActiveRange(range)}
                    className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-md transition-colors ${
                      activeRange === range
                        ? 'bg-white dark:bg-[#16171a] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <Button
                variant='default'
                size='xs'
                onClick={handleShare}
                className='rounded-lg bg-neutral-950 dark:bg-white hover:bg-neutral-850 dark:hover:bg-neutral-100 text-white dark:text-neutral-950 px-3 shadow-2xs text-xs font-medium cursor-pointer active:scale-[0.97]'
              >
                <Share2 className='size-3 mr-1' />
                <span>Share</span>
              </Button>
            </div>
          </div>

          {/* ── 2-PANE ASYMMETRIC WEALTH BENTO (7/5 Split) ── */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch'>
            {/* Left 7 cols: Total Net Worth Hero */}
            <div className='lg:col-span-7 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-1.5'>
                  <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                  <span className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>
                    Total Net Worth
                  </span>
                  <span className='text-neutral-300 dark:text-neutral-700'>
                    ·
                  </span>
                  <span className='text-[10px] text-neutral-400 font-mono'>
                    6 Ledgers Live
                  </span>
                </div>
                <span className='px-2 py-0.5 rounded-full text-[10px] font-mono font-medium inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                  <ArrowUpRight className='size-2.5' /> +30.9% all-time
                </span>
              </div>

              <div className='text-2xl sm:text-3xl font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 leading-none'>
                ₹48,24,190
              </div>

              <div className='grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[10px] font-mono'>
                <div>
                  <span className='text-neutral-400 block'>Invested</span>
                  <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                    ₹36,83,900
                  </span>
                </div>
                <div>
                  <span className='text-neutral-400 block'>
                    Unrealized P&amp;L
                  </span>
                  <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                    +₹11,40,290
                  </span>
                </div>
                <div>
                  <span className='text-neutral-400 block'>NIFTY Alpha</span>
                  <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                    +12.4%
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Today's Return & Target Progress */}
            <div className='lg:col-span-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-1.5'>
                  <span className='size-1.5 rounded-full bg-emerald-500' />
                  <span className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>
                    Today&apos;s Return
                  </span>
                </div>
                <span className='px-2 py-0.5 rounded-full text-[10px] font-mono font-medium inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                  <ArrowUpRight className='size-2.5' /> +0.31% today
                </span>
              </div>

              <div className='text-2xl sm:text-3xl font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 leading-none'>
                +₹14,820
              </div>

              <div className='p-2.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1.5 text-[10px] font-mono'>
                <div className='flex justify-between'>
                  <span className='text-neutral-500'>Cash vs Equity</span>
                  <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                    94% Equity · 6% Cash
                  </span>
                </div>
                <div className='w-full h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex gap-0.5'>
                  <div
                    className='h-full bg-emerald-500 rounded-l-full'
                    style={{ width: '94%' }}
                  />
                  <div
                    className='h-full bg-blue-500 rounded-r-full'
                    style={{ width: '6%' }}
                  />
                </div>
                <div className='flex justify-between text-neutral-400'>
                  <span className='flex items-center gap-1'>
                    <span className='size-1 rounded-full bg-emerald-500 animate-pulse' />
                    <span>All 3 broker feeds live</span>
                  </span>
                  <span>₹36.8L deployed</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── TWO-COLUMN SECTION: WEALTH CURVE & ASSET SPREAD ── */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'>
            {/* Left: Moment 1: Wealth Curve + Active Holdings (7 cols) */}
            <div className='lg:col-span-7 space-y-4'>
              {/* Wealth Curve Card */}
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-4 sm:p-5 shadow-2xs relative'>
                <div className='flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80'>
                  <div>
                    <h4 className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>
                      Net worth vs. invested
                    </h4>
                    <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-mono'>
                      +30.9% consolidated growth
                    </span>
                  </div>
                  <div className='flex items-center gap-3 text-[10px] font-medium text-neutral-500 dark:text-neutral-400'>
                    <span className='flex items-center gap-1'>
                      <span className='size-1.5 rounded-full bg-emerald-500' />
                      Net worth
                    </span>
                    <span className='flex items-center gap-1'>
                      <span className='size-1.5 rounded-full bg-neutral-400' />
                      Invested
                    </span>
                  </div>
                </div>

                {/* SVG Curve */}
                <div className='pt-2'>
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className='w-full h-auto max-h-[190px] select-none'
                  >
                    <defs>
                      <linearGradient
                        id='heroNetWorthFill'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='0%'
                          stopColor='#10b981'
                          stopOpacity='0.16'
                        />
                        <stop
                          offset='100%'
                          stopColor='#10b981'
                          stopOpacity='0.0'
                        />
                      </linearGradient>
                      <linearGradient
                        id='heroDeltaFill'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='0%'
                          stopColor='currentColor'
                          stopOpacity='0.0'
                        />
                        <stop
                          offset='100%'
                          stopColor='currentColor'
                          stopOpacity='0.08'
                        />
                      </linearGradient>
                    </defs>

                    <line
                      x1={padX}
                      y1={topY}
                      x2={width - padX}
                      y2={topY}
                      className='stroke-neutral-200/60 dark:stroke-neutral-800/80'
                      strokeDasharray='4 4'
                    />
                    <line
                      x1={padX}
                      y1={zeroY}
                      x2={width - padX}
                      y2={zeroY}
                      className='stroke-neutral-300 dark:stroke-neutral-700'
                    />

                    {/* Fills & Polylines */}
                    <polygon
                      points={`${getX(0)},${zeroY} ${netWorthPoints.join(' ')} ${getX(TIMELINE_DATA.length - 1)},${zeroY}`}
                      fill='url(#heroNetWorthFill)'
                    />
                    <polygon
                      points={`${getX(0)},${zeroY} ${deltaPoints.join(' ')} ${getX(TIMELINE_DATA.length - 1)},${zeroY}`}
                      fill='url(#heroDeltaFill)'
                      className='text-neutral-500 dark:text-neutral-400'
                    />
                    <polyline
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.2'
                      className='text-neutral-300 dark:text-neutral-700'
                      points={deltaPoints.join(' ')}
                    />
                    <polyline
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.2'
                      strokeDasharray='4 4'
                      className='text-neutral-400 dark:text-neutral-500'
                      points={investedPoints.join(' ')}
                    />
                    <polyline
                      fill='none'
                      stroke='#10b981'
                      strokeWidth='2'
                      points={netWorthPoints.join(' ')}
                    />

                    {TIMELINE_DATA.map((item, index) => {
                      const cx = getX(index);
                      const cy = getYNetWorth(item.netWorth);
                      const isHovered = hoveredPoint === index;
                      return (
                        <g
                          key={item.month}
                          onMouseEnter={() => setHoveredPoint(index)}
                          className='cursor-pointer'
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 4.5 : 3}
                            className={
                              isHovered
                                ? 'fill-emerald-500 stroke-white dark:stroke-neutral-900 stroke-2'
                                : 'fill-emerald-600'
                            }
                          />
                          <text
                            x={cx}
                            y={height - 2}
                            textAnchor='middle'
                            className={`text-[10px] font-mono ${isHovered ? 'fill-neutral-900 dark:fill-white font-bold' : 'fill-neutral-400'}`}
                          >
                            {item.month}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Active Holdings Snippet */}
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-4 shadow-2xs'>
                <div className='flex items-center justify-between pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80 text-xs font-semibold'>
                  <span>Top holdings</span>
                  <span className='text-[10px] font-mono text-neutral-400'>
                    Live P&amp;L
                  </span>
                </div>
                <div className='divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs'>
                  {HOLDINGS_PREVIEW.map(h => (
                    <div
                      key={h.symbol}
                      className='py-2 flex items-center justify-between'
                    >
                      <div>
                        <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
                          {h.symbol}
                        </span>
                        <div className='flex items-center gap-1.5 text-[10px] text-neutral-500'>
                          <span
                            className={`size-1 rounded-full ${h.brokerDot}`}
                          />
                          <span>{h.broker}</span>
                          <span>· {h.qty} shares</span>
                        </div>
                      </div>
                      <div className='text-right font-mono tnum'>
                        <span className='font-bold text-neutral-900 dark:text-neutral-100 block'>
                          {h.value}
                        </span>
                        <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold'>
                          {h.pnl} ({h.pnlPct})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Moment 2: Asset Allocation & Schedule (5 cols) */}
            <div className='lg:col-span-5 space-y-4'>
              {/* Asset Spread */}
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-4 sm:p-5 shadow-2xs space-y-3.5'>
                <div className='flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/80'>
                  <span className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>
                    Asset distribution
                  </span>
                  <span className='text-[10px] font-mono text-neutral-400'>
                    42% Equity
                  </span>
                </div>

                <div className='w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 flex overflow-hidden gap-0.5 p-0.5'>
                  <div
                    className='h-full bg-blue-600 rounded-l-full'
                    style={{ width: '42%' }}
                  />
                  <div
                    className='h-full bg-orange-500'
                    style={{ width: '28%' }}
                  />
                  <div
                    className='h-full bg-emerald-500'
                    style={{ width: '16%' }}
                  />
                  <div
                    className='h-full bg-amber-500 rounded-r-full'
                    style={{ width: '14%' }}
                  />
                </div>

                <div className='space-y-2 text-xs'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <span className='size-1.5 rounded-full bg-blue-600' />
                      <span className='text-neutral-800 dark:text-neutral-200'>
                        Equities
                      </span>
                    </div>
                    <span className='font-mono tnum font-semibold'>
                      ₹20,26,160
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <span className='size-1.5 rounded-full bg-orange-500' />
                      <span className='text-neutral-800 dark:text-neutral-200'>
                        Mutual Funds
                      </span>
                    </div>
                    <span className='font-mono tnum font-semibold'>
                      ₹13,50,770
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <span className='size-1.5 rounded-full bg-emerald-500' />
                      <span className='text-neutral-800 dark:text-neutral-200'>
                        EPF &amp; Debt
                      </span>
                    </div>
                    <span className='font-mono tnum font-semibold'>
                      ₹7,71,870
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <span className='size-1.5 rounded-full bg-amber-500' />
                      <span className='text-neutral-800 dark:text-neutral-200'>
                        Gold Bullion
                      </span>
                    </div>
                    <span className='font-mono tnum font-semibold'>
                      ₹6,75,390
                    </span>
                  </div>
                </div>

                <div className='p-2.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 text-[11px] text-neutral-600 dark:text-neutral-400'>
                  <span className='font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1 mb-0.5'>
                    <ShieldCheck className='size-3 text-emerald-600' />{' '}
                    Rebalance Alert
                  </span>
                  Equity allocation is +2% above target model. Routing upcoming
                  SIPs into EPF &amp; Debt.
                </div>
              </div>

              {/* Depository Schedule */}
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-4 shadow-2xs space-y-2.5 text-xs'>
                <span className='font-semibold text-neutral-900 dark:text-neutral-100 block'>
                  Upcoming triggers
                </span>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='size-3.5 text-emerald-500' />
                    <span>Auto-SIP (2 Folios)</span>
                  </div>
                  <span className='font-mono font-bold'>₹30,000</span>
                </div>

                <div className='flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60'>
                  <div className='flex items-center gap-2'>
                    <Landmark className='size-3.5 text-neutral-500' />
                    <span>Section 80C Cap</span>
                  </div>
                  <span className='font-mono text-emerald-600 dark:text-emerald-400 font-semibold'>
                    83% Utilized
                  </span>
                </div>

                <div className='flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60'>
                  <div className='flex items-center gap-2'>
                    <Coins className='size-3.5 text-amber-500' />
                    <span>Spot Gold 24K</span>
                  </div>
                  <span className='font-mono font-bold'>
                    ₹76,420
                    <span className='text-[10px] text-neutral-400 font-normal'>
                      /10g
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoinTrackHeroMockup;
