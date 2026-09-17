'use client';

import {
  TrendingUp,
  Briefcase,
  ShieldCheck,
  ReceiptText,
  Clock,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/primitives/badge';
import { Button } from '@/components/ui/primitives/button';

export function CoinTrackFeatures() {
  return (
    <section
      id='features'
      className='scroll-mt-28 py-20 px-4 sm:px-6 relative z-10'
    >
      <div className='max-w-6xl mx-auto'>
        {/* Section Header */}
        <div className='text-center max-w-3xl mx-auto mb-14'>
          <Badge
            variant='default'
            className='mb-4 bg-blue-500/10 text-blue-700 border-blue-500/20 font-semibold px-3 py-1 text-xs lowercase first-letter:uppercase tracking-normal'
          >
            Institutional Portfolio Architecture
          </Badge>
          <h2 className='font-display font-bold text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight leading-tight'>
            All your investments laid bare across one unified page.
          </h2>
          <p className='text-neutral-600 text-sm sm:text-base md:text-lg mt-4 leading-relaxed'>
            Direct real-time tracking across Zerodha, Upstox, and Angel One,
            combined seamlessly with your statutory ledgers, mutual funds, gold,
            and fixed deposits.
          </p>
        </div>

        {/* 3 Bento Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Card 1: Direct Broker Sync */}
          <div className='bg-white/95 backdrop-blur-sm rounded-[28px] border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between group'>
            <div>
              <div className='size-11 rounded-2xl bg-neutral-950 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform'>
                <TrendingUp className='size-5' />
              </div>
              <h3 className='font-display font-bold text-xl text-neutral-950 tracking-tight'>
                Unified Broker Sync
              </h3>
              <p className='text-xs sm:text-sm text-neutral-600 mt-2.5 leading-relaxed'>
                Instant synchronization with Zerodha Kite, Upstox, and Angel
                One. Automatically roll up equities, derivatives, ETF units, and
                live unrealized P&L without manual CSV uploads.
              </p>
            </div>

            {/* Interactive Broker Status Widget */}
            <div className='mt-8 pt-5 border-t border-neutral-100 space-y-2.5'>
              <div className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/60 text-xs'>
                <div className='flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                  <span className='font-medium text-neutral-800'>
                    Zerodha Kite
                  </span>
                </div>
                <Badge
                  variant='success'
                  className='text-[10px] lowercase first-letter:uppercase'
                >
                  Live sync
                </Badge>
              </div>

              <div className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/60 text-xs'>
                <div className='flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-blue-600' />
                  <span className='font-medium text-neutral-800'>
                    Upstox Pro
                  </span>
                </div>
                <Badge
                  variant='default'
                  className='text-[10px] lowercase first-letter:uppercase'
                >
                  Connected
                </Badge>
              </div>

              <div className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/60 text-xs'>
                <div className='flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-emerald-500' />
                  <span className='font-medium text-neutral-800'>
                    Angel One
                  </span>
                </div>
                <Badge
                  variant='success'
                  className='text-[10px] lowercase first-letter:uppercase'
                >
                  Verified
                </Badge>
              </div>
            </div>
          </div>

          {/* Card 2: Statutory & Alternative Wealth */}
          <div className='bg-white/95 backdrop-blur-sm rounded-[28px] border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between group'>
            <div>
              <div className='size-11 rounded-2xl bg-neutral-950 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform'>
                <Briefcase className='size-5' />
              </div>
              <h3 className='font-display font-bold text-xl text-neutral-950 tracking-tight'>
                Statutory & Alternative Assets
              </h3>
              <p className='text-xs sm:text-sm text-neutral-600 mt-2.5 leading-relaxed'>
                Granular tracking for EPF, PPF, Fixed Deposits, Gold & Silver
                bullion, and automated Mutual Fund SIP backfilling to capture
                your entire net worth accurately.
              </p>
            </div>

            {/* Asset Allocation progress bars */}
            <div className='mt-8 pt-5 border-t border-neutral-100 space-y-3'>
              <div>
                <div className='flex items-center justify-between text-xs mb-1.5'>
                  <span className='font-medium text-neutral-700'>
                    Equities & ETFs
                  </span>
                  <span className='font-mono font-semibold text-neutral-900'>
                    54%
                  </span>
                </div>
                <div className='h-2 w-full bg-neutral-100 rounded-full overflow-hidden'>
                  <div className='h-full bg-blue-600 rounded-full w-[54%]' />
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between text-xs mb-1.5'>
                  <span className='font-medium text-neutral-700'>
                    Mutual Funds & SIPs
                  </span>
                  <span className='font-mono font-semibold text-neutral-900'>
                    26%
                  </span>
                </div>
                <div className='h-2 w-full bg-neutral-100 rounded-full overflow-hidden'>
                  <div className='h-full bg-amber-500 rounded-full w-[26%]' />
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between text-xs mb-1.5'>
                  <span className='font-medium text-neutral-700'>
                    EPF, PPF & Fixed Deposits
                  </span>
                  <span className='font-mono font-semibold text-neutral-900'>
                    20%
                  </span>
                </div>
                <div className='h-2 w-full bg-neutral-100 rounded-full overflow-hidden'>
                  <div className='h-full bg-emerald-500 rounded-full w-[20%]' />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: FIFO Capital Gains & Tax Engine */}
          <div className='bg-white/95 backdrop-blur-sm rounded-[28px] border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between group'>
            <div>
              <div className='size-11 rounded-2xl bg-neutral-950 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform'>
                <ReceiptText className='size-5' />
              </div>
              <h3 className='font-display font-bold text-xl text-neutral-950 tracking-tight'>
                FIFO Capital Gains & Tax Engine
              </h3>
              <p className='text-xs sm:text-sm text-neutral-600 mt-2.5 leading-relaxed'>
                Institutional First-In-First-Out (FIFO) calculations for
                Short-Term (STCG) and Long-Term (LTCG) tax liability, dividend
                tracking, and XIRR performance metrics.
              </p>
            </div>

            {/* Metrics Rows */}
            <div className='mt-8 pt-5 border-t border-neutral-100 space-y-2.5'>
              <div className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/60 text-xs'>
                <span className='flex items-center gap-1.5 text-neutral-600'>
                  <Clock className='size-3.5 text-neutral-400' />
                  Portfolio XIRR
                </span>
                <span className='font-display font-bold text-emerald-600'>
                  +24.8% p.a.
                </span>
              </div>
              <div className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/60 text-xs'>
                <span className='flex items-center gap-1.5 text-neutral-600'>
                  <CheckCircle2 className='size-3.5 text-emerald-500' />
                  STCG / LTCG Segregation
                </span>
                <span className='font-display font-bold text-neutral-950'>
                  Automated
                </span>
              </div>
              <div className='flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/60 text-xs'>
                <span className='flex items-center gap-1.5 text-neutral-600'>
                  <ShieldCheck className='size-3.5 text-blue-500' />
                  Zero Knowledge Auth
                </span>
                <span className='font-display font-bold text-neutral-950'>
                  TOTP 2FA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Link into Design Lab */}
        <div className='mt-10 text-center'>
          <Button
            asChild
            variant='secondary'
            size='lg'
            className='rounded-full bg-white/90 hover:bg-white text-neutral-900 font-semibold text-xs px-6 py-3 border border-neutral-200 shadow-xs'
          >
            <Link href='/design-lab/dashboard'>
              <span>Explore live holdings in Design Lab</span>
              <ArrowUpRight className='size-3.5 ml-1.5' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
