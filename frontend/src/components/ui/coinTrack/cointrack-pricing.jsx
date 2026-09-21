'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/primitives/tabs';

export function CoinTrackPricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section
      id='pricing'
      className='scroll-mt-28 pt-8 sm:pt-10 pb-16 sm:pb-20 px-3 sm:px-6 relative z-10'
    >
      <div className='max-w-6xl mx-auto'>
        {/* Section Title */}
        <div className='text-center max-w-3xl mx-auto mb-10 sm:mb-12'>
          <h2 className='font-display font-bold text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl text-neutral-950 dark:text-white tracking-tight leading-tight'>
            Transparent pricing for serious investors.
          </h2>
          <p className='text-neutral-600 dark:text-neutral-400 text-xs sm:text-base md:text-lg mt-3 sm:mt-4 leading-relaxed'>
            One clean plan that scales with your net worth. Zero hidden
            commissions or per-trade cuts.
          </p>

          {/* Frosted Segmented Tab Switch using Tabs primitive */}
          <div className='mt-6 sm:mt-8 flex justify-center'>
            <Tabs
              value={isAnnual ? 'yearly' : 'monthly'}
              onValueChange={val => setIsAnnual(val === 'yearly')}
              className='w-auto'
            >
              <TabsList className='bg-white/85 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/70 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[20px] p-1.5'>
                <TabsTrigger
                  value='monthly'
                  className='rounded-2xl px-4 sm:px-5 py-2 text-xs font-semibold data-[state=active]:bg-neutral-950 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm transition-all duration-200'
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger
                  value='yearly'
                  className='rounded-2xl px-4 sm:px-5 py-2 text-xs font-semibold data-[state=active]:bg-neutral-950 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm transition-all duration-200 gap-1.5'
                >
                  <span>Yearly</span>
                  <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'>
                    Save 20%
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch'>
          {/* Plan 1: Starter */}
          <div className='bg-white/95 dark:bg-neutral-950/70 backdrop-blur-sm rounded-2xl min-[400px]:rounded-[32px] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-all duration-300 p-5 min-[400px]:p-7 flex flex-col justify-between'>
            <div>
              <span className='font-display font-bold text-lg text-neutral-950 dark:text-white block'>
                Starter
              </span>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                Essential portfolio tracking for retail investors.
              </p>

              <div className='flex items-baseline gap-1.5 mt-5 sm:mt-6'>
                <span className='font-display font-extrabold text-3xl sm:text-4xl text-neutral-950 dark:text-white'>
                  Free
                </span>
                <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                  / forever
                </span>
              </div>

              {/* Feature list */}
              <div className='space-y-3 pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-neutral-100 dark:border-neutral-800'>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Up to 2 connected broker demats</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>EPF, PPF &amp; Fixed Deposits tracking</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Daily P&amp;L and asset allocation roll-up</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Google SSO &amp; TOTP 2FA security</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Standard community support</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              variant='outline'
              size='lg'
              className='mt-6 sm:mt-8 w-full rounded-full border-neutral-300/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold text-xs'
            >
              <Link href='/design-lab/register'>Open Free Account</Link>
            </Button>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className='bg-white dark:bg-neutral-950 rounded-2xl min-[400px]:rounded-[32px] border-2 border-neutral-950 dark:border-neutral-700 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] p-5 min-[400px]:p-7 flex flex-col justify-between relative md:-translate-y-2'>
            {/* Badge */}
            <div className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow'>
              Most Popular
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <span className='font-display font-bold text-lg text-neutral-950 dark:text-white block'>
                  Pro
                </span>
                <span className='flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 rounded-full'>
                  <Sparkles className='size-3' /> Full Engine
                </span>
              </div>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                Complete wealth intelligence with automated tax calculation.
              </p>

              <div className='flex items-baseline gap-1.5 mt-5 sm:mt-6'>
                <span className='font-display font-extrabold text-3xl sm:text-4xl text-neutral-950 dark:text-white'>
                  ${isAnnual ? '10' : '12'}
                </span>
                <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                  / month
                </span>
              </div>

              {/* Feature list */}
              <div className='space-y-3 pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-neutral-100 dark:border-neutral-800'>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0' />
                  <span>Unlimited brokers (Zerodha, Upstox, Angel One)</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0' />
                  <span>Automated SIP backfill &amp; Mutual Funds sync</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0' />
                  <span>FIFO Capital Gains Tax Engine (STCG &amp; LTCG)</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0' />
                  <span>All-time XIRR &amp; Benchmark vs Nifty 50</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0' />
                  <span>coinTrack Copilot Portfolio Rebalancing</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0' />
                  <span>Priority sync updates &amp; dedicated support</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              variant='default'
              size='lg'
              className='mt-6 sm:mt-8 w-full rounded-full bg-neutral-950 hover:bg-neutral-850 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-semibold text-xs shadow-md'
            >
              <Link href='/design-lab/register'>Start 14-Day Pro Trial</Link>
            </Button>
          </div>

          {/* Plan 3: Family Office */}
          <div className='bg-white/95 dark:bg-neutral-950/70 backdrop-blur-sm rounded-2xl min-[400px]:rounded-[32px] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-all duration-300 p-5 min-[400px]:p-7 flex flex-col justify-between'>
            <div>
              <span className='font-display font-bold text-lg text-neutral-950 dark:text-white block'>
                Family Office
              </span>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                For high-net-worth individuals, trusts, and multi-entity wealth.
              </p>

              <div className='flex items-baseline gap-1.5 mt-5 sm:mt-6'>
                <span className='font-display font-extrabold text-3xl sm:text-4xl text-neutral-950 dark:text-white'>
                  Custom
                </span>
                <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                  / bespoke
                </span>
              </div>

              {/* Feature list */}
              <div className='space-y-3 pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-neutral-100 dark:border-neutral-800'>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Multi-member family portfolio consolidation</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Audited CA &amp; Tax Consultant schedule exports</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Unlisted shares &amp; Private Equity ledgers</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Dedicated Private Wealth Manager</span>
                </div>
                <div className='flex items-start sm:items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300'>
                  <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0' />
                  <span>Self-hosted or isolated database tenant</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              variant='outline'
              size='lg'
              className='mt-6 sm:mt-8 w-full rounded-full border-neutral-300/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold text-xs'
            >
              <Link href='/design-lab'>Explore Family Office Lab</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
