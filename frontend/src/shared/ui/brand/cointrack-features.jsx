'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Briefcase,
  ShieldCheck,
  ReceiptText,
  Clock,
} from 'lucide-react';
import { Badge } from '@/shared/ui/primitives/badge';

export function CoinTrackFeatures() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  const scaleHover = {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  };

  return (
    <section
      id='features'
      className='scroll-mt-28 py-14 sm:py-20 px-3 sm:px-6 relative z-10'
    >
      <div className='max-w-6xl mx-auto'>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='text-center max-w-3xl mx-auto mb-10 sm:mb-14'
        >
          <Badge
            variant='default'
            className='mb-4 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30 font-semibold px-3 py-1 text-xs lowercase first-letter:uppercase tracking-normal'
          >
            Institutional Portfolio Architecture
          </Badge>
          <h2 className='font-display font-bold text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl text-neutral-950 dark:text-white tracking-tight leading-tight'>
            All your investments laid bare across one unified page.
          </h2>
          <p className='text-neutral-600 dark:text-neutral-400 text-xs sm:text-base md:text-lg mt-3 sm:mt-4 leading-relaxed'>
            Direct real-time tracking across Zerodha, Upstox, and Angel One,
            combined seamlessly with your statutory ledgers, mutual funds, gold,
            and fixed deposits.
          </p>
        </motion.div>

        {/* 3 Bento Cards */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, margin: '-100px' }}
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6'
        >
          {/* Card 1: Direct Broker Sync */}
          <motion.div
            variants={itemVariants}
            className='bg-white/95 dark:bg-neutral-950/70 backdrop-blur-sm rounded-2xl min-[400px]:rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)] transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between group'
          >
            <div>
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className='size-11 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform'
              >
                <TrendingUp className='size-5' />
              </motion.div>
              <h3 className='font-display font-bold text-lg sm:text-xl text-neutral-950 dark:text-white tracking-tight'>
                Unified Broker Sync
              </h3>
              <p className='text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2.5 leading-relaxed'>
                Instant synchronization with Zerodha Kite, Upstox, and Angel
                One. Automatically roll up equities, derivatives, ETF units, and
                live unrealized P&L without manual CSV uploads.
              </p>
            </div>

            {/* Interactive Broker Status Widget */}
            <div className='mt-8 pt-5 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5'>
              <motion.div
                whileHover={scaleHover}
                className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 text-xs hover:bg-white dark:hover:bg-neutral-800 transition-colors cursor-default'
              >
                <div className='flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                  <span className='font-medium text-neutral-800 dark:text-neutral-200'>
                    Zerodha Kite
                  </span>
                </div>
                <Badge
                  variant='success'
                  className='text-[10px] lowercase first-letter:uppercase'
                >
                  Live sync
                </Badge>
              </motion.div>

              <motion.div
                whileHover={scaleHover}
                className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 text-xs hover:bg-white dark:hover:bg-neutral-800 transition-colors cursor-default'
              >
                <div className='flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-blue-600' />
                  <span className='font-medium text-neutral-800 dark:text-neutral-200'>
                    Upstox Pro
                  </span>
                </div>
                <Badge
                  variant='default'
                  className='text-[10px] lowercase first-letter:uppercase'
                >
                  Connected
                </Badge>
              </motion.div>

              <motion.div
                whileHover={scaleHover}
                className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 text-xs hover:bg-white dark:hover:bg-neutral-800 transition-colors cursor-default'
              >
                <div className='flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-emerald-500' />
                  <span className='font-medium text-neutral-800 dark:text-neutral-200'>
                    Angel One
                  </span>
                </div>
                <Badge
                  variant='success'
                  className='text-[10px] lowercase first-letter:uppercase'
                >
                  Verified
                </Badge>
              </motion.div>
            </div>
          </motion.div>

          {/* Card 2: Statutory & Alternative Wealth */}
          <motion.div
            variants={itemVariants}
            className='bg-white/95 dark:bg-neutral-950/70 backdrop-blur-sm rounded-2xl min-[400px]:rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)] transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between group'
          >
            <div>
              <motion.div
                whileHover={{ rotate: -10, scale: 1.1 }}
                className='size-11 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform'
              >
                <Briefcase className='size-5' />
              </motion.div>
              <h3 className='font-display font-bold text-lg sm:text-xl text-neutral-950 dark:text-white tracking-tight'>
                Statutory & Alternative Assets
              </h3>
              <p className='text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2.5 leading-relaxed'>
                Granular tracking for EPF, PPF, Fixed Deposits, Gold & Silver
                bullion, and automated Mutual Fund SIP backfilling to capture
                your entire net worth accurately.
              </p>
            </div>

            {/* Asset Allocation progress bars */}
            <div className='mt-8 pt-5 border-t border-neutral-100 dark:border-neutral-800 space-y-3'>
              <div>
                <div className='flex items-center justify-between text-xs mb-1.5'>
                  <span className='font-medium text-neutral-700 dark:text-neutral-300'>
                    Equities & ETFs
                  </span>
                  <span className='font-mono font-semibold text-neutral-900 dark:text-white'>
                    54%
                  </span>
                </div>
                <div className='h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden'>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '54%' }}
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                    viewport={{ once: true }}
                    className='h-full bg-blue-600 rounded-full'
                  />
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between text-xs mb-1.5'>
                  <span className='font-medium text-neutral-700 dark:text-neutral-300'>
                    Mutual Funds & SIPs
                  </span>
                  <span className='font-mono font-semibold text-neutral-900 dark:text-white'>
                    26%
                  </span>
                </div>
                <div className='h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden'>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '26%' }}
                    transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    viewport={{ once: true }}
                    className='h-full bg-amber-500 rounded-full'
                  />
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between text-xs mb-1.5'>
                  <span className='font-medium text-neutral-700 dark:text-neutral-300'>
                    EPF, PPF & Fixed Deposits
                  </span>
                  <span className='font-mono font-semibold text-neutral-900 dark:text-white'>
                    20%
                  </span>
                </div>
                <div className='h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden'>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '20%' }}
                    transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                    viewport={{ once: true }}
                    className='h-full bg-emerald-500 rounded-full'
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Tax Harvest & Insights */}
          <motion.div
            variants={itemVariants}
            className='bg-white/95 dark:bg-neutral-950/70 backdrop-blur-sm rounded-2xl min-[400px]:rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)] transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between group sm:col-span-2 lg:col-span-1'
          >
            <div>
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                className='size-11 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform'
              >
                <ReceiptText className='size-5' />
              </motion.div>
              <h3 className='font-display font-bold text-lg sm:text-xl text-neutral-950 dark:text-white tracking-tight'>
                Tax Harvest & Insights
              </h3>
              <p className='text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2.5 leading-relaxed'>
                Automated short-term and long-term capital gains calculation.
                Identify tax-loss harvesting opportunities instantly across your
                entire aggregated portfolio.
              </p>
            </div>

            {/* Smart Alerts UI */}
            <div className='mt-8 pt-5 border-t border-neutral-100 dark:border-neutral-800 space-y-3'>
              <motion.div
                whileHover={scaleHover}
                className='p-3 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 cursor-default'
              >
                <div className='flex items-center gap-2 mb-1'>
                  <ShieldCheck className='size-4 text-blue-600' />
                  <span className='text-xs font-semibold text-blue-900 dark:text-blue-200'>
                    Tax Harvest Opportunity
                  </span>
                </div>
                <p className='text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed'>
                  Book ₹1.2L in LTCG from mutual funds before March 31st to
                  utilize the annual tax-free exemption threshold.
                </p>
              </motion.div>

              <motion.div
                whileHover={scaleHover}
                className='p-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 cursor-default'
              >
                <div className='flex items-center gap-2 mb-1'>
                  <Clock className='size-4 text-amber-600' />
                  <span className='text-xs font-semibold text-amber-900 dark:text-amber-200'>
                    Rebalance Alert
                  </span>
                </div>
                <p className='text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed'>
                  Equity allocation is currently 4% above target model due to
                  recent market run-up. Consider shifting to Debt.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

