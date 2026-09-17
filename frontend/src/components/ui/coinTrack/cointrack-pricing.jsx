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
      className='scroll-mt-28 pt-10 pb-20 px-4 sm:px-6 relative z-10'
    >
      <div className='max-w-6xl mx-auto'>
        {/* Section Title */}
        <div className='text-center max-w-3xl mx-auto mb-12'>
          <h2 className='font-display font-bold text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight leading-tight'>
            Transparent pricing for serious investors.
          </h2>
          <p className='text-neutral-600 text-sm sm:text-base md:text-lg mt-4 leading-relaxed'>
            One clean plan that scales with your net worth. Zero hidden
            commissions or per-trade cuts.
          </p>

          {/* Frosted Segmented Tab Switch using Tabs primitive */}
          <div className='mt-8 flex justify-center'>
            <Tabs
              value={isAnnual ? 'yearly' : 'monthly'}
              onValueChange={val => setIsAnnual(val === 'yearly')}
              className='w-auto'
            >
              <TabsList className='bg-white/85 backdrop-blur-xl border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[20px] p-1.5'>
                <TabsTrigger
                  value='monthly'
                  className='rounded-2xl px-5 py-2 text-xs font-semibold data-[state=active]:bg-neutral-950 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200'
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger
                  value='yearly'
                  className='rounded-2xl px-5 py-2 text-xs font-semibold data-[state=active]:bg-neutral-950 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 gap-1.5'
                >
                  <span>Yearly</span>
                  <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600'>
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
          <div className='bg-white/95 backdrop-blur-sm rounded-[32px] border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 p-7 flex flex-col justify-between'>
            <div>
              <span className='font-display font-bold text-lg text-neutral-950 block'>
                Starter
              </span>
              <p className='text-xs text-neutral-500 mt-1'>
                Essential portfolio tracking for retail investors.
              </p>

              <div className='flex items-baseline gap-1.5 mt-6'>
                <span className='font-display font-extrabold text-4xl text-neutral-950'>
                  Free
                </span>
                <span className='text-xs font-medium text-neutral-500'>
                  / forever
                </span>
              </div>

              {/* Feature list */}
              <div className='space-y-3 pt-6 mt-6 border-t border-neutral-100'>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Up to 2 connected broker demats</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>EPF, PPF &amp; Fixed Deposits tracking</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Daily P&amp;L and asset allocation roll-up</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Google SSO &amp; TOTP 2FA security</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Standard community support</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              variant='outline'
              size='lg'
              className='mt-8 w-full rounded-full border-neutral-300/80 hover:bg-neutral-50 font-semibold text-xs'
            >
              <Link href='/design-lab/register'>Open Free Account</Link>
            </Button>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className='bg-white rounded-[32px] border-2 border-neutral-950 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] p-7 flex flex-col justify-between relative md:-translate-y-2'>
            {/* Badge */}
            <div className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-neutral-950 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow'>
              Most Popular
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <span className='font-display font-bold text-lg text-neutral-950 block'>
                  Pro
                </span>
                <span className='flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full'>
                  <Sparkles className='size-3' /> Full Engine
                </span>
              </div>
              <p className='text-xs text-neutral-500 mt-1'>
                Complete wealth intelligence with automated tax calculation.
              </p>

              <div className='flex items-baseline gap-1.5 mt-6'>
                <span className='font-display font-extrabold text-4xl text-neutral-950'>
                  ${isAnnual ? '10' : '12'}
                </span>
                <span className='text-xs font-medium text-neutral-500'>
                  / month
                </span>
              </div>

              {/* Feature list */}
              <div className='space-y-3 pt-6 mt-6 border-t border-neutral-100'>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700 font-medium'>
                  <Check className='size-4 text-emerald-600 shrink-0 stroke-[2.5]' />
                  <span>Unlimited brokers (Zerodha, Upstox, Angel One)</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700 font-medium'>
                  <Check className='size-4 text-emerald-600 shrink-0 stroke-[2.5]' />
                  <span>Automated SIP backfill &amp; Mutual Funds sync</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700 font-medium'>
                  <Check className='size-4 text-emerald-600 shrink-0 stroke-[2.5]' />
                  <span>FIFO Capital Gains Tax Engine (STCG &amp; LTCG)</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700 font-medium'>
                  <Check className='size-4 text-emerald-600 shrink-0 stroke-[2.5]' />
                  <span>All-time XIRR &amp; Benchmark vs Nifty 50</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700 font-medium'>
                  <Check className='size-4 text-emerald-600 shrink-0 stroke-[2.5]' />
                  <span>coinTrack Copilot Portfolio Rebalancing</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700 font-medium'>
                  <Check className='size-4 text-emerald-600 shrink-0 stroke-[2.5]' />
                  <span>Priority sync updates &amp; dedicated support</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              variant='default'
              size='lg'
              className='mt-8 w-full rounded-full bg-neutral-950 hover:bg-neutral-850 text-white font-semibold text-xs shadow-md'
            >
              <Link href='/design-lab/register'>Start 14-Day Pro Trial</Link>
            </Button>
          </div>

          {/* Plan 3: Family Office */}
          <div className='bg-white/95 backdrop-blur-sm rounded-[32px] border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 p-7 flex flex-col justify-between'>
            <div>
              <span className='font-display font-bold text-lg text-neutral-950 block'>
                Family Office
              </span>
              <p className='text-xs text-neutral-500 mt-1'>
                For high-net-worth individuals, trusts, and multi-entity wealth.
              </p>

              <div className='flex items-baseline gap-1.5 mt-6'>
                <span className='font-display font-extrabold text-4xl text-neutral-950'>
                  Custom
                </span>
                <span className='text-xs font-medium text-neutral-500'>
                  / bespoke
                </span>
              </div>

              {/* Feature list */}
              <div className='space-y-3 pt-6 mt-6 border-t border-neutral-100'>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Multi-member family portfolio consolidation</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Audited CA &amp; Tax Consultant schedule exports</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Unlisted shares &amp; Private Equity ledgers</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Dedicated Private Wealth Manager</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
                  <Check className='size-4 text-emerald-600 shrink-0' />
                  <span>Self-hosted or isolated database tenant</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              variant='outline'
              size='lg'
              className='mt-8 w-full rounded-full border-neutral-300/80 hover:bg-neutral-50 font-semibold text-xs'
            >
              <Link href='/design-lab'>Explore Family Office Lab</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
