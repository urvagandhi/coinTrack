'use client';

import Image from 'next/image';
import { TrendingUp, ShieldCheck, Landmark } from 'lucide-react';

export function CoinTrackDesignTokens() {
  return (
    <section
      id='architecture'
      className='scroll-mt-28 pt-16 pb-10 px-4 sm:px-6 relative z-10'
    >
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-10'>
          <div className='flex items-center gap-3 mb-2'>
            <span className='relative block size-10 shrink-0'>
              <Image
                src='/coinTrack.png'
                alt='coinTrack'
                width={40}
                height={40}
                className='w-full h-full object-contain'
              />
            </span>
            <h2 className='font-display font-extrabold text-4xl sm:text-5xl text-neutral-950 tracking-tight leading-none'>
              coinTrack
            </h2>
          </div>
          <p className='text-neutral-700 text-sm sm:text-base font-medium pl-13'>
            A modern, high-fidelity wealth operating system engineered for
            institutional clarity, speed, and precision.
          </p>
        </div>

        {/* 3 Design Token Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch'>
          {/* Token Card 1: Typography System */}
          <div className='bg-white rounded-3xl p-6 border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-lg transition-shadow'>
            <div>
              <div className='flex items-center justify-between text-xs text-neutral-500 mb-4'>
                <span className='font-medium text-neutral-600'>
                  Type Architecture
                </span>
                <span className='bg-neutral-950 text-white font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full'>
                  82 / 1.04
                </span>
              </div>

              <div className='py-4 flex items-baseline gap-4'>
                <span
                  className='font-display font-extrabold text-5xl sm:text-6xl text-neutral-950 tracking-tight'
                  title='Inter Tight 800'
                >
                  Aa
                </span>
                <span
                  className='font-sans font-medium text-4xl sm:text-5xl text-neutral-500'
                  title='Inter 500'
                >
                  Aa
                </span>
                <span
                  className='font-mono font-semibold text-3xl sm:text-4xl text-neutral-800'
                  title='Geist Mono 600'
                >
                  01
                </span>
              </div>
            </div>

            <div className='pt-6 border-t border-neutral-100 grid grid-cols-3 gap-2 text-xs'>
              <div>
                <span className='text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold'>
                  Display
                </span>
                <span className='font-display font-bold text-neutral-950 text-xs sm:text-sm mt-0.5 block'>
                  Inter Tight
                </span>
                <span className='text-[10px] text-neutral-500 font-mono'>
                  700 / 800
                </span>
              </div>
              <div>
                <span className='text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold'>
                  Interface
                </span>
                <span className='font-sans font-medium text-neutral-950 text-xs sm:text-sm mt-0.5 block'>
                  Inter
                </span>
                <span className='text-[10px] text-neutral-500 font-mono'>
                  400 / 500
                </span>
              </div>
              <div>
                <span className='text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold'>
                  Numerics
                </span>
                <span className='font-mono font-bold text-neutral-950 text-xs sm:text-sm mt-0.5 block'>
                  Geist Mono
                </span>
                <span className='text-[10px] text-neutral-500 font-mono'>
                  Tabular nums
                </span>
              </div>
            </div>
          </div>

          {/* Token Card 2: Net Worth & Semantic Colors */}
          <div className='bg-white rounded-3xl p-6 border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-lg transition-shadow'>
            <div>
              <div className='flex items-center justify-between text-xs font-medium text-neutral-500 mb-3'>
                <div className='flex items-center gap-1.5'>
                  <TrendingUp className='size-3.5 text-emerald-600' />
                  <span>Consolidated Wealth</span>
                </div>
                <div className='flex items-center gap-1'>
                  <span
                    className='size-2 rounded-full bg-[#2563eb]'
                    title='Brand Blue #2563eb'
                  />
                  <span
                    className='size-2 rounded-full bg-[#10b981]'
                    title='Gain Emerald #10b981'
                  />
                  <span
                    className='size-2 rounded-full bg-[#f59e0b]'
                    title='Warning Amber #f59e0b'
                  />
                  <span
                    className='size-2 rounded-full bg-[#f43f5e]'
                    title='Loss Rose #f43f5e'
                  />
                </div>
              </div>

              <div className='my-2'>
                <span className='font-display font-extrabold text-4xl sm:text-5xl text-neutral-950 tracking-tight'>
                  ₹48,92,400
                </span>
              </div>

              <div className='flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-2'>
                <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                <span>+24.8% all-time XIRR · Live P&amp;L</span>
              </div>
            </div>

            {/* Segmented bar for asset allocation */}
            <div className='pt-8'>
              <div className='w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex gap-1 p-0.5'>
                <div
                  className='h-full bg-blue-600 w-[52%] rounded-l-full'
                  title='Equities (52%)'
                />
                <div
                  className='h-full bg-amber-500 w-[26%]'
                  title='Mutual Funds (26%)'
                />
                <div
                  className='h-full bg-emerald-500 w-[14%]'
                  title='EPF & PPF (14%)'
                />
                <div
                  className='h-full bg-slate-400 w-[8%] rounded-r-full'
                  title='Gold & FDs (8%)'
                />
              </div>
              <div className='flex justify-between text-[10px] text-neutral-500 mt-2 font-medium'>
                <span className='text-blue-600 font-semibold'>
                  Equities 52%
                </span>
                <span className='text-amber-600 font-semibold'>MFs 26%</span>
                <span className='text-emerald-600 font-semibold'>EPF 14%</span>
                <span className='text-slate-600 font-semibold'>Gold 8%</span>
              </div>
            </div>
          </div>

          {/* Token Card 3: Elevation, Motion & Zero-Trust */}
          <div className='bg-white rounded-3xl p-6 border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-lg transition-shadow'>
            <div>
              <div className='flex items-center justify-between text-xs font-medium text-neutral-500 mb-3'>
                <div className='flex items-center gap-1.5'>
                  <Landmark className='size-3.5 text-neutral-400' />
                  <span>Coverage &amp; Security</span>
                </div>
                <span className='text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-semibold'>
                  TOTP 2FA
                </span>
              </div>

              <div className='my-2'>
                <span className='font-display font-extrabold text-4xl sm:text-5xl text-neutral-950 tracking-tight'>
                  99.98%
                </span>
              </div>

              <div className='flex items-center gap-1.5 text-xs font-semibold text-blue-600 mt-2'>
                <ShieldCheck className='size-3.5' />
                <span>Zerodha · Upstox · Angel One · EPFO</span>
              </div>
            </div>

            <div className='pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600'>
              <span className='flex items-center gap-1 font-medium'>
                <span className='size-1.5 rounded-full bg-blue-600' />
                FIFO Tax Engine
              </span>
              <span className='font-mono font-bold text-neutral-950 bg-neutral-100 px-2 py-0.5 rounded-md text-[11px]'>
                &lt;1ms latency
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
