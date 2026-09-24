'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/ui/primitives/button';
import {
  LayoutGrid,
  Inbox,
  Users,
  LineChart,
  GitFork,
  Search,
  Bell,
  Home,
  MessageSquare,
  User,
  Clock,
  SlidersHorizontal,
  Calendar,
  Upload,
  Share2,
  Flame,
  CornerUpLeft,
  Timer,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';

const TOP_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'inbox', label: 'Inbox', count: '28', icon: Inbox },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'stats', label: 'Stats', icon: LineChart },
  { id: 'flows', label: 'Flows', icon: GitFork },
];

const CHART_MONTHS = [
  { month: 'Jan', messenger: 2400, sales: 900, maxTotal: 3300 },
  { month: 'Feb', messenger: 3400, sales: 1100, maxTotal: 4500 },
  { month: 'Mar', messenger: 4400, sales: 1500, maxTotal: 5900 },
  { month: 'Apr', messenger: 5200, sales: 1700, maxTotal: 6900 },
  { month: 'May', messenger: 6600, sales: 2100, maxTotal: 8700 },
  {
    month: 'Jun',
    messenger: 7100,
    sales: 2400,
    maxTotal: 9500,
    hasTooltip: true,
  },
  { month: 'Jul', messenger: 8100, sales: 2200, maxTotal: 10300 },
  { month: 'Aug', messenger: 9200, sales: 2500, maxTotal: 11700 },
  { month: 'Sep', messenger: 7800, sales: 2400, maxTotal: 10200 },
  { month: 'Oct', messenger: 0, sales: 0, isHatched: true },
];

export function CoinTrackHeroMockup() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeRange, setActiveRange] = useState('7 days');
  const [selectedMonth, setSelectedMonth] = useState('Jun');
  const [shareToast, setShareToast] = useState(false);

  const handleShare = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2400);
  };

  return (
    <div className='w-full max-w-5xl mx-auto rounded-2xl min-[400px]:rounded-[32px] md:rounded-[40px] bg-white dark:bg-neutral-950 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_30px_90px_-20px_rgba(15,23,42,0.16)] p-3 min-[400px]:p-4 sm:p-6 md:p-8 text-neutral-900 dark:text-white transition-all relative overflow-hidden'>
      {/* Toast alert */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2'
          >
            <span>✨ Live dashboard link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP HEADER SHELL NAVIGATION ── */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800'>
        {/* Left Tabs (Apple-style segmented pill) */}
        <div className='flex items-center gap-1 overflow-x-auto p-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-800 shrink-0 scrollbar-none max-w-full'>
          {TOP_TABS.map(tab => {
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
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:text-white hover:bg-neutral-100 dark:bg-neutral-800/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId='active-mockup-tab'
                    className='absolute inset-0 bg-neutral-950 rounded-full'
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className='relative z-10 flex items-center gap-1.5'>
                  <Icon className='size-3.5' />
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'text-neutral-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Profile Utilities */}
        <div className='flex items-center gap-2.5 self-end lg:self-auto'>
          {/* Search bar */}
          <div className='relative hidden sm:block'>
            <Search className='size-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2' />
            <input
              type='text'
              readOnly
              placeholder='Search threads, contacts...'
              className='pl-8 pr-3 py-1.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 w-44 md:w-56 focus:outline-none'
            />
          </div>

          {/* Notification bell */}
          <button
            type='button'
            className='size-8 rounded-full border border-neutral-200/70 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:bg-neutral-900 transition-colors'
            aria-label='Notifications'
          >
            <Bell className='size-3.5' />
          </button>

          {/* User badge */}
          <div className='size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-center shadow-xs'>
            EM
          </div>
        </div>
      </div>

      {/* ── MAIN BODY: LEFT FLOATING RAIL + CENTER BOX + RIGHT COLUMN ── */}
      <div className='pt-6 flex flex-col md:flex-row gap-5 items-start'>
        {/* Left Floating Rail (as in screenshot) */}
        <div className='hidden xl:flex flex-col items-center gap-4 py-3 px-1.5 rounded-full bg-neutral-50/90 dark:bg-neutral-900/50 border border-neutral-200/70 shrink-0 shadow-2xs'>
          <button
            type='button'
            className='size-7 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shadow-xs'
            title='Home'
          >
            <Home className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/60 flex items-center justify-center transition-colors'
            title='Chat'
          >
            <MessageSquare className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/60 flex items-center justify-center transition-colors'
            title='Contacts'
          >
            <User className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/60 flex items-center justify-center transition-colors'
            title='Workflows'
          >
            <GitFork className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/60 flex items-center justify-center transition-colors'
            title='History'
          >
            <Clock className='size-3.5' />
          </button>
          <button
            type='button'
            className='size-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/60 flex items-center justify-center transition-colors'
            title='Settings'
          >
            <SlidersHorizontal className='size-3.5' />
          </button>
        </div>

        {/* Center Main Card: Business Overview */}
        <div className='flex-1 min-w-0 rounded-2xl min-[400px]:rounded-[28px] border border-neutral-200/80 bg-white dark:bg-neutral-950 p-4 min-[400px]:p-5 sm:p-6 space-y-6 w-full'>
          {/* Header Row */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div>
              <h3 className='font-display font-bold text-lg min-[400px]:text-xl sm:text-2xl text-neutral-950 dark:text-white tracking-tight leading-tight'>
                Business overview
              </h3>
              <p className='text-xs text-neutral-500 dark:text-neutral-500 mt-0.5'>
                Real-time signals from every channel you sell on.
              </p>
            </div>

            {/* Actions: 7 days, Export, Share */}
            <div className='flex flex-wrap items-center gap-2 self-start sm:self-auto'>
              <Button
                variant='outline'
                size='xs'
                onClick={() =>
                  setActiveRange(
                    activeRange === '7 days' ? '30 days' : '7 days'
                  )
                }
                className='rounded-full border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 px-3'
              >
                <Calendar className='size-3 text-neutral-400 mr-1' />
                <span>{activeRange}</span>
              </Button>

              <Button
                variant='outline'
                size='xs'
                className='rounded-full border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 px-3'
              >
                <Upload className='size-3 text-neutral-400 mr-1' />
                <span>Export</span>
              </Button>

              <Button
                variant='default'
                size='xs'
                onClick={handleShare}
                className='rounded-full bg-neutral-950 hover:bg-neutral-850 text-white px-3.5 shadow-xs active:scale-[0.97]'
              >
                <Share2 className='size-3 mr-1' />
                <span>Share</span>
              </Button>
            </div>
          </div>

          {/* 4 Key Metrics */}
          <div className='grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pt-1'>
            {/* Stat 1: Hot leads today */}
            <div className='space-y-1 p-2 min-[380px]:p-0 rounded-xl bg-neutral-50/50 min-[380px]:bg-transparent dark:bg-neutral-900/30 min-[380px]:dark:bg-transparent'>
              <div className='flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs'>
                <Flame className='size-3.5 text-neutral-400 dark:text-neutral-500' />
                <span>Hot leads today</span>
              </div>
              <div className='font-display text-xl min-[400px]:text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                {activeRange === '7 days' ? '382' : '1,420'}
              </div>
              <div className='text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5'>
                <span>↑ 18% wow</span>
              </div>
            </div>

            {/* Stat 2: Pending replies */}
            <div className='space-y-1 p-2 min-[380px]:p-0 rounded-xl bg-neutral-50/50 min-[380px]:bg-transparent dark:bg-neutral-900/30 min-[380px]:dark:bg-transparent'>
              <div className='flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs'>
                <CornerUpLeft className='size-3.5 text-neutral-400 dark:text-neutral-500' />
                <span>Pending replies</span>
              </div>
              <div className='font-display text-xl min-[400px]:text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                4
              </div>
              <div className='text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-0.5'>
                <span>↓ 2 since am</span>
              </div>
            </div>

            {/* Stat 3: Avg response */}
            <div className='space-y-1 p-2 min-[380px]:p-0 rounded-xl bg-neutral-50/50 min-[380px]:bg-transparent dark:bg-neutral-900/30 min-[380px]:dark:bg-transparent'>
              <div className='flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs'>
                <Timer className='size-3.5 text-neutral-400 dark:text-neutral-500' />
                <span>Avg response</span>
              </div>
              <div className='font-display text-xl min-[400px]:text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                2m 09s
              </div>
              <div className='text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5'>
                <span>↑ 12% faster</span>
              </div>
            </div>

            {/* Stat 4: Revenue from chats */}
            <div className='space-y-1 p-2 min-[380px]:p-0 rounded-xl bg-neutral-50/50 min-[380px]:bg-transparent dark:bg-neutral-900/30 min-[380px]:dark:bg-transparent'>
              <div className='flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs'>
                <CreditCard className='size-3.5 text-neutral-400 dark:text-neutral-500' />
                <span>Revenue from chats</span>
              </div>
              <div className='font-display text-xl min-[400px]:text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                $97,418
              </div>
              <div className='text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5'>
                <span>↑ 18% mom</span>
              </div>
            </div>
          </div>

          {/* Continuous Segmented Bar */}
          <div className='w-full h-2 rounded-full overflow-hidden flex gap-0.5 mt-2 bg-neutral-100 dark:bg-neutral-800'>
            <div className='h-full bg-[#2563eb] w-[30%] rounded-l-full' />
            <div className='h-full bg-[#f97316] w-[30%]' />
            <div className='h-full bg-[#10b981] w-[25%]' />
            <div className='h-full bg-[repeating-linear-gradient(45deg,#cbd5e1,#cbd5e1_3px,#f1f5f9_3px,#f1f5f9_6px)] dark:bg-[repeating-linear-gradient(45deg,#334155,#334155_3px,#1e293b_3px,#1e293b_6px)] w-[15%] rounded-r-full border-l border-white/50 dark:border-neutral-800' />
          </div>

          {/* Divider */}
          <div className='border-t border-neutral-100 dark:border-neutral-800 pt-4' />

          {/* Messages vs. sales Header */}
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <span className='font-display font-bold text-sm text-neutral-900 dark:text-white block'>
                Messages vs. sales
              </span>
              <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                ↑ 18% more than last month
              </span>
            </div>

            {/* Legend */}
            <div className='flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-neutral-600 dark:text-neutral-400'>
              <span className='flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-[#2563eb]' />
                <span>Messenger</span>
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-[#f97316]' />
                <span>Sales</span>
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-[#10b981]' />
                <span>Renewals</span>
              </span>
              <button
                type='button'
                className='flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-[11px] font-medium'
              >
                <span>View</span>
                <ArrowUpRight className='size-3 text-neutral-400' />
              </button>
            </div>
          </div>

          {/* Bar Chart Canvas with Y-Axis */}
          <div className='relative pt-4 pb-2 overflow-x-auto scrollbar-none'>
            <div className='flex gap-2 sm:gap-3 h-52 min-w-[340px]'>
              {/* Y-Axis scale */}
              <div className='flex flex-col justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500 pb-6 select-none shrink-0 w-8 text-right'>
                <span>10,500</span>
                <span>7,100</span>
                <span>4,800</span>
                <span>2,400</span>
                <span>0</span>
              </div>

              {/* Grid + Bars Container */}
              <div className='flex-1 flex flex-col justify-between relative'>
                {/* Horizontal Guide Lines */}
                <div className='absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 opacity-40'>
                  <div className='border-b border-dashed border-neutral-200 dark:border-neutral-800 w-full' />
                  <div className='border-b border-dashed border-neutral-200 dark:border-neutral-800 w-full' />
                  <div className='border-b border-dashed border-neutral-200 dark:border-neutral-800 w-full' />
                  <div className='border-b border-dashed border-neutral-200 dark:border-neutral-800 w-full' />
                  <div className='border-b border-neutral-200 dark:border-neutral-800 w-full' />
                </div>

                {/* Bars Row */}
                <div className='flex items-end justify-between gap-1 sm:gap-2 h-full pb-6 px-1 relative z-10'>
                  {CHART_MONTHS.map((item, idx) => {
                    const maxScale = 12000;
                    const messengerHeight = Math.min(
                      78,
                      (item.messenger / maxScale) * 100
                    );
                    const salesHeight = Math.min(
                      22,
                      (item.sales / maxScale) * 100
                    );
                    const isSelected = selectedMonth === item.month;
                    const tooltipPosClass =
                      idx < 2
                        ? 'left-0'
                        : idx > CHART_MONTHS.length - 3
                          ? 'right-0'
                          : '-left-1/2 translate-x-1/4';

                    return (
                      <div
                        key={item.month}
                        onClick={() => setSelectedMonth(item.month)}
                        className='flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative'
                      >
                        {/* Interactive Tooltip on Selected / Hovered Month */}
                        {isSelected && !item.isHatched && (
                          <motion.div
                            layoutId='chart-tooltip'
                            className={`absolute -top-16 z-30 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200/90 dark:border-neutral-800 p-2 text-left min-w-[110px] pointer-events-none ${tooltipPosClass}`}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 25,
                            }}
                          >
                            <span className='font-display font-bold text-[11px] text-neutral-900 dark:text-white block'>
                              {item.month === 'Jun'
                                ? 'June 2026'
                                : `${item.month} 2026`}
                            </span>
                            <div className='flex items-center gap-1.5 text-[10px] text-neutral-600 dark:text-neutral-400 mt-1'>
                              <span className='size-1.5 rounded-full bg-[#2563eb]' />
                              <span>Messenger</span>
                            </div>
                            <div className='flex items-center justify-between gap-2 text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5'>
                              <div className='flex items-center gap-1.5'>
                                <span className='size-1.5 rounded-full bg-[#f97316]' />
                                <span>Sales</span>
                              </div>
                              <span className='font-mono font-semibold text-neutral-900 dark:text-white'>
                                ${item.sales.toLocaleString()}
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Bar Structure */}
                        {item.isHatched ? (
                          /* Oct Hatched Bar */
                          <div className='w-full max-w-[32px] h-[48%] rounded-t-xl bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_4px,#e2e8f0_4px,#e2e8f0_8px)] dark:bg-[repeating-linear-gradient(45deg,#1e293b,#1e293b_4px,#334155_4px,#334155_8px)] border border-dashed border-slate-300 dark:border-slate-700 transition-transform group-hover:scale-105' />
                        ) : (
                          /* Stacked Bars */
                          <div className='w-full max-w-[32px] flex flex-col items-center gap-1 transition-transform duration-200 group-hover:scale-105'>
                            {/* Orange Sales Bar (Top) */}
                            <div
                              style={{ height: `${salesHeight * 1.5}%` }}
                              className='w-full min-h-[8px] bg-[#f97316] rounded-t-lg shadow-2xs'
                            />
                            {/* Blue Messenger Bar (Bottom) */}
                            <div
                              style={{ height: `${messengerHeight * 1.4}%` }}
                              className={`w-full min-h-[16px] bg-[#2563eb] rounded-b-md transition-shadow ${
                                isSelected
                                  ? 'ring-2 ring-blue-500 shadow-md'
                                  : 'group-hover:opacity-90'
                              }`}
                            />
                          </div>
                        )}

                        {/* Month Label */}
                        <span
                          className={`absolute -bottom-5 text-[9px] min-[400px]:text-[10px] sm:text-[11px] transition-colors ${
                            isSelected
                              ? 'font-bold text-neutral-950 dark:text-white'
                              : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200'
                          }`}
                        >
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (2 STACKED CARDS) ── */}
        <div className='w-full md:w-72 lg:w-80 space-y-4 shrink-0'>
          {/* Card 1: AI reply suggestions */}
          <div className='rounded-[28px] border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden shadow-xs'>
            {/* Top Mock Area with sky blue gradient */}
            <div className='bg-gradient-to-b from-[#e8f1fb] to-[#f4f7fa] dark:from-neutral-900 dark:to-neutral-900/60 p-4 sm:p-5 space-y-2.5'>
              {/* Bubble 1 */}
              <div className='bg-white dark:bg-neutral-950/80 rounded-2xl p-3 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-xs max-w-[85%] ml-auto text-right leading-relaxed border border-blue-50/60 dark:border-neutral-800'>
                You have to be replying to chats faster.
              </div>

              {/* Bubble 2 */}
              <div className='bg-white dark:bg-neutral-950/80 rounded-2xl p-3 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-xs max-w-[80%] ml-auto text-right leading-relaxed border border-blue-50/60 dark:border-neutral-800'>
                This is the perfect comment.
              </div>

              {/* Generating pill */}
              <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-neutral-950/90 backdrop-blur-xs text-blue-600 dark:text-blue-400 text-[11px] font-medium shadow-xs border border-blue-100 dark:border-neutral-800'>
                <Sparkles className='size-3 text-blue-500 dark:text-blue-400 animate-spin' />
                <span>Generating reply...</span>
              </div>
            </div>

            {/* Bottom Text Area */}
            <div className='p-5 space-y-1.5'>
              <h4 className='font-display font-bold text-sm text-neutral-950 dark:text-white tracking-tight'>
                AI reply suggestions
              </h4>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed'>
                Drafts a tone-matched response in two seconds whenever the inbox
                queue tips over five threads.
              </p>
            </div>
          </div>

          {/* Card 2: Lead quality */}
          <div className='rounded-[28px] border border-neutral-200/80 bg-white dark:bg-neutral-950 p-5 shadow-xs'>
            {/* Header */}
            <div className='flex items-center justify-between mb-3'>
              <span className='font-display font-bold text-sm text-neutral-950 dark:text-white'>
                Lead quality
              </span>
              <button
                type='button'
                className='text-neutral-400 hover:text-neutral-700 dark:text-neutral-300'
                aria-label='Options'
              >
                <MoreHorizontal className='size-4' />
              </button>
            </div>

            {/* Radial Dial / Gauge */}
            <div className='relative w-full h-28 flex flex-col items-center justify-end pb-2'>
              <svg viewBox='0 0 120 65' className='w-48 h-26'>
                {/* Background Track with tick marks */}
                <path
                  d='M 15 60 A 45 45 0 0 1 105 60'
                  fill='none'
                  stroke='#f1f5f9'
                  strokeWidth='6'
                  strokeLinecap='round'
                />
                {/* Tick marks around perimeter */}
                {[...Array(9)].map((_, i) => {
                  const angle = (Math.PI / 8) * i;
                  const x1 = 60 - Math.cos(angle) * 49;
                  const y1 = 60 - Math.sin(angle) * 49;
                  const x2 = 60 - Math.cos(angle) * 44;
                  const y2 = 60 - Math.sin(angle) * 44;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke='#cbd5e1'
                      strokeWidth='1.2'
                      strokeLinecap='round'
                    />
                  );
                })}
                {/* Colored Gradient Progress Arc */}
                <path
                  d='M 15 60 A 45 45 0 0 1 105 60'
                  fill='none'
                  stroke='url(#lead-gauge-gradient)'
                  strokeWidth='6'
                  strokeLinecap='round'
                />
                <defs>
                  <linearGradient
                    id='lead-gauge-gradient'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='0%'
                  >
                    <stop offset='0%' stopColor='#2563eb' />
                    <stop offset='45%' stopColor='#06b6d4' />
                    <stop offset='100%' stopColor='#10b981' />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Counter */}
              <div className='absolute bottom-1 flex flex-col items-center leading-tight'>
                <span className='font-display text-2xl font-extrabold text-neutral-950 dark:text-white tracking-tight'>
                  1,000
                </span>
                <span className='text-[10px] text-neutral-400 font-medium'>
                  total leads
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

