'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import {
  Check,
  ArrowRight,
  Search,
  Sparkles,
  Send,
  CheckCircle2,
} from 'lucide-react';

export function CoinTrackInboxSection() {
  const [actionApproved, setActionApproved] = useState(false);

  return (
    <section
      id='intelligence'
      className='scroll-mt-28 py-14 sm:py-24 px-3 sm:px-6 relative z-10'
    >
      <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center'>
        {/* Left Column: 6 cols */}
        <div className='lg:col-span-6 space-y-5 sm:space-y-6'>
          <Badge
            variant='default'
            className='bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30 font-semibold px-3 py-1 text-xs lowercase first-letter:uppercase tracking-normal'
          >
            <Sparkles className='size-3 mr-1 text-blue-600 inline' />
            <span>Autonomous Portfolio Intelligence</span>
          </Badge>

          <h2 className='font-display font-bold text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl text-neutral-950 dark:text-white tracking-tight leading-tight'>
            The terminal that makes wealth management effortless.
          </h2>

          <p className='text-neutral-600 dark:text-neutral-400 text-sm sm:text-base md:text-lg leading-relaxed'>
            You don&apos;t need five different broker apps, bank portals, and
            messy spreadsheets. coinTrack aggregates your investments, alerts
            you to rebalancing needs, and automates your tax records.
          </p>

          {/* Bullet points with solid black circle icons */}
          <div className='space-y-4 pt-2'>
            <div className='flex items-start gap-3.5'>
              <div className='size-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs'>
                <Check className='size-3.5 stroke-[3]' />
              </div>
              <div>
                <h4 className='font-display font-bold text-neutral-900 dark:text-white text-sm sm:text-base'>
                  One-tap portfolio rebalancing
                </h4>
                <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 mt-0.5 leading-relaxed'>
                  Adjust target equity-debt weights, rebalance across brokers,
                  or log physical gold purchases in seconds.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='size-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs'>
                <Check className='size-3.5 stroke-[3]' />
              </div>
              <div>
                <h4 className='font-display font-bold text-neutral-900 dark:text-white text-sm sm:text-base'>
                  Instant context dossier
                </h4>
                <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 mt-0.5 leading-relaxed'>
                  Know your total invested capital, all-time XIRR, short-term
                  tax exposure, and dividend yield before making your next
                  trade.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='size-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs'>
                <Check className='size-3.5 stroke-[3]' />
              </div>
              <div>
                <h4 className='font-display font-bold text-neutral-900 dark:text-white text-sm sm:text-base'>
                  Zero-trust security & privacy
                </h4>
                <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 mt-0.5 leading-relaxed'>
                  Frictionless Google SSO combined with TOTP 2FA. Encrypted
                  broker tokens, isolated tenant databases, and zero data
                  selling.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs (Links strictly to Design Lab) */}
          <div className='flex flex-wrap items-center gap-4 pt-4'>
            <Button
              asChild
              variant='default'
              size='lg'
              className='rounded-full bg-neutral-950 hover:bg-neutral-850 text-white font-semibold text-xs px-6 py-3.5 shadow-md active:scale-[0.97]'
            >
              <Link href='/design-lab/dashboard'>
                <span>Test Drive in Design Lab</span>
                <ArrowRight className='size-3.5 ml-1' />
              </Link>
            </Button>
            <Link
              href='/design-lab'
              className='text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:text-white transition-colors flex items-center gap-1'
            >
              Explore component primitives →
            </Link>
          </div>
        </div>

        {/* Right Column: 6 cols (Floating Portfolio Intelligence Card) */}
        <div className='lg:col-span-6'>
          <div className='bg-white dark:bg-neutral-950 rounded-2xl min-[400px]:rounded-[32px] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.14)] p-4 min-[400px]:p-5 sm:p-7 relative transition-all'>
            {/* Top intelligence navigation bar */}
            <div className='flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-neutral-100 dark:border-neutral-800'>
              <div className='flex items-center gap-2'>
                <span className='font-display font-bold text-sm text-neutral-900 dark:text-white'>
                  Live Alerts
                </span>
                <span className='text-[11px] font-semibold text-white bg-neutral-950 px-2 py-0.5 rounded-full'>
                  3 actionable
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <Search className='size-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2' />
                  <input
                    type='text'
                    readOnly
                    placeholder='Filter assets...'
                    className='pl-8 pr-3 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 text-neutral-700 dark:text-neutral-300 w-28 min-[400px]:w-36 sm:w-44 focus:outline-none'
                  />
                </div>
              </div>
            </div>

            {/* Intelligence Stream */}
            <div className='pt-4 sm:pt-5 space-y-4'>
              {/* Signal Alert */}
              <div className='p-3.5 sm:p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/50 border border-neutral-200/70 dark:border-neutral-800'>
                <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
                  <div className='flex items-center gap-2 sm:gap-2.5'>
                    <div className='size-7 sm:size-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-neutral-950 font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-xs'>
                      SIP
                    </div>
                    <div>
                      <div className='flex flex-wrap items-center gap-1 sm:gap-1.5'>
                        <span className='font-display font-bold text-xs text-neutral-900 dark:text-white'>
                          Monthly Auto-SIP Trigger
                        </span>
                        <span className='text-[10px] text-neutral-400 dark:text-neutral-500'>
                          · Zerodha Kite
                        </span>
                      </div>
                      <span className='text-[10px] text-neutral-400 dark:text-neutral-500 block'>
                        Nifty 50 Index Fund &amp; Parag Parikh Flexi Cap
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-1.5 self-start sm:self-center'>
                    <span className='size-1.5 rounded-full bg-emerald-500' />
                    <span className='text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full'>
                      Ready
                    </span>
                  </div>
                </div>

                <p className='text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pl-0 min-[400px]:pl-9 sm:pl-10 mt-2 min-[400px]:mt-0'>
                  &ldquo;₹30,000 monthly SIP queued for execution tomorrow
                  morning. Current NAV allocation matches your long-term
                  model.&rdquo;
                </p>
              </div>

              {/* AI Auto-Rebalance Container */}
              <div className='p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200/70 dark:border-blue-900/40 relative'>
                <div className='flex flex-wrap items-center justify-between gap-2 mb-2.5'>
                  <span className='text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5'>
                    <Sparkles className='size-3.5 text-blue-600 dark:text-blue-400' />
                    coinTrack Copilot · Suggested Rebalance
                  </span>
                  <span className='text-[10px] text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/60 px-2 py-0.5 rounded-full font-medium'>
                    99.8% confidence
                  </span>
                </div>

                <div className='p-3 rounded-xl bg-white/90 dark:bg-neutral-900/80 backdrop-blur-xs border border-blue-100 dark:border-blue-900/50 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed shadow-xs'>
                  &ldquo;Equity exposure is currently at 64% (+4% above target).
                  To harvest ₹1,20,000 LTCG under the ₹1.25L annual exemption
                  threshold, consider booking gains in Reliance Industries
                  before March 31st.&rdquo;
                </div>

                {/* Actions */}
                <div className='flex flex-col min-[400px]:flex-row items-start min-[400px]:items-center justify-between gap-2 pt-3 mt-1'>
                  <span className='text-[11px] text-neutral-500 dark:text-neutral-500'>
                    {actionApproved ? (
                      <span className='text-emerald-600 font-semibold flex items-center gap-1'>
                        <CheckCircle2 className='size-3.5' /> Strategy logged to
                        Tax Dossier!
                      </span>
                    ) : (
                      'Click to log recommended tax action'
                    )}
                  </span>

                  <div className='flex items-center gap-2 self-end min-[400px]:self-auto'>
                    <Button
                      type='button'
                      variant='default'
                      size='sm'
                      onClick={() => setActionApproved(!actionApproved)}
                      className='rounded-full bg-neutral-950 hover:bg-neutral-850 text-white gap-1.5 text-xs'
                    >
                      <Send className='size-3' />
                      <span>{actionApproved ? 'Logged' : '1-Click Log'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
