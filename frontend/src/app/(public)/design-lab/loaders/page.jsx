'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { FintechLoader } from '@/components/ui/loaders/FintechLoader';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Play,
  Sparkles,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Import available Lottie JSON files
import businessInvestor from '@/components/ui/loaders/business-investor-gaining-profit-from-investment.json';
import cardPayment from '@/components/ui/loaders/card-payment.json';
import coinStack from '@/components/ui/loaders/coin-stack.json';

const Lottie = dynamic(() => import('@/components/ui/loaders/LottieWrapper'), {
  ssr: false,
});

export default function FintechLoaderDemoPage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [simulateActive, setSimulateActive] = useState(false);

  const codeSnippet = `<FintechLoader
  isLoading={isLoading}
/>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateTransaction = () => {
    if (simulateActive) return;
    setSimulateActive(true);
    setIsLoading(true);

    // Simulate network delay (4 seconds of loading, cards stay out)
    setTimeout(() => {
      setIsLoading(false); // Triggers cards retracting into the phone

      // Wait for exit animation & completion state to display for ~2s, then reset state
      setTimeout(() => {
        setSimulateActive(false);
        // Normally here you'd route to the dashboard, we just reset it for the demo
        setIsLoading(true);
      }, 2400);
    }, 4000);
  };

  return (
    <div className='min-h-screen bg-[#f5f8fc] dark:bg-[#030712] text-neutral-900 dark:text-neutral-50 flex flex-col font-sans'>
      {/* Top Header */}
      <header className='border-b border-border/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link
            href='/design-lab'
            className='p-2 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors'
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-display text-xl tracking-tight font-bold text-foreground'>
                Loaders & Animations Engine
              </span>
              <span className='px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold'>
                Lottie + Framer
              </span>
            </div>
            <p className='text-xs text-neutral-700/90 dark:text-neutral-400 font-sans'>
              Showcase of in-house React loaders and Lottie JSON animations.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <ThemeToggle />
          <button
            onClick={() => setShowOverlay(true)}
            className='h-9 px-4 text-xs font-sans font-medium rounded-xl border border-border/50 hover:bg-muted/50 transition-colors flex items-center gap-2 text-foreground'
          >
            Test Modal Overlay
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className='flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-12'>
        {/* Section 1: Custom FintechLoader */}
        <div>
          <h2 className='font-display text-2xl font-bold tracking-tight mb-6 flex items-center gap-2 text-foreground'>
            <Sparkles className='text-amber-500' size={20} />
            Fintech Loader (Framer Motion)
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
            {/* Left Column: Animation Stage */}
            <section className='lg:col-span-8 flex flex-col'>
              <div className='relative flex-1 min-h-[490px] rounded-2xl border border-border/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center overflow-hidden shadow-xl'>
                {/* Ambient Background Corner Glows */}
                <div className='absolute -top-24 -left-24 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none' />
                <div className='absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none' />

                {/* Stage Grid Overlay */}
                <div
                  className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none'
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* The Loader Component */}
                <div className='relative z-10 flex flex-col items-center'>
                  <FintechLoader
                    isLoading={isLoading}
                    title='Processing Transaction'
                    subtitle='Securing ledger state...'
                    completeTitle='Transaction Complete'
                    completeSubtitle='Redirecting to dashboard...'
                  />
                </div>

                {/* Micro Footer Indicator */}
                <div className='absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border/50 pt-3 gap-2'>
                  <span>Mode: {isLoading ? 'Processing' : 'Completed'}</span>
                  <span>Frame: Vector SVG + Framer Physics</span>
                </div>
              </div>
            </section>

            {/* Right Column: Controls & Integration */}
            <aside className='lg:col-span-4 space-y-6'>
              {/* Controls Card */}
              <div className='rounded-2xl border border-border/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 space-y-5 shadow-sm'>
                <div className='border-b border-border/50 pb-3'>
                  <h3 className='font-display text-lg tracking-tight font-bold text-foreground'>
                    Animation Lifecycle
                  </h3>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Trigger the loading lifecycle to see the cards inject back
                    into the phone and proceed to dashboard.
                  </p>
                </div>

                <button
                  onClick={simulateTransaction}
                  disabled={simulateActive}
                  className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    simulateActive
                      ? 'bg-muted text-muted-foreground border border-border/50 cursor-not-allowed'
                      : 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-md'
                  }`}
                >
                  {simulateActive ? (
                    <>
                      <Loader2 size={16} className='animate-spin' />
                      Simulating Transaction...
                    </>
                  ) : (
                    <>
                      <Play size={16} fill='currentColor' />
                      Trigger Complete Lifecycle
                    </>
                  )}
                </button>

                <div className='pt-2'>
                  <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                    <div
                      className={`flex-1 h-1 rounded-full transition-colors duration-500 ${isLoading ? 'bg-amber-500' : 'bg-muted'}`}
                    />
                    <div
                      className={`flex-1 h-1 rounded-full transition-colors duration-500 delay-300 ${!isLoading ? 'bg-emerald-500' : 'bg-muted'}`}
                    />
                  </div>
                  <div className='flex justify-between mt-2 font-mono text-[10px] uppercase'>
                    <span
                      className={isLoading ? 'text-amber-500 font-bold' : ''}
                    >
                      Cards Ejected
                    </span>
                    <span
                      className={!isLoading ? 'text-emerald-500 font-bold' : ''}
                    >
                      Cards Retracted
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Import Snippet */}
              <div className='rounded-2xl border border-border/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 space-y-3 shadow-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs uppercase tracking-wider text-muted-foreground font-mono'>
                    Usage
                  </span>
                  <button
                    onClick={handleCopy}
                    className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'
                  >
                    {copied ? (
                      <>
                        <Check size={12} className='text-amber-500' />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className='p-3.5 rounded-xl bg-muted/40 border border-border/50 font-mono text-[11px] leading-relaxed overflow-x-auto text-foreground/90'>
                  <code>{codeSnippet}</code>
                </pre>
              </div>
            </aside>
          </div>
        </div>

        {/* Section 2: Lottie Animations Gallery */}
        <div>
          <div className='flex items-center gap-2 mb-6 border-b border-border/50 pb-4'>
            <Palette className='text-emerald-500' size={20} />
            <div>
              <h2 className='font-display text-xl font-bold tracking-tight text-foreground'>
                Lottie Animations Gallery (Crisp JSON)
              </h2>
              <p className='text-xs text-neutral-700/90 dark:text-neutral-400 font-sans mt-0.5'>
                Identical fintech stage background with rhythmic breathing glow
                animations
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Card Payment */}
            <div className='relative rounded-2xl border border-border/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center overflow-hidden shadow-xl group transition-all min-h-[320px]'>
              {/* Ambient Background Corner Glows (Exact Fintech Loader match) */}
              <div className='absolute -top-20 -left-20 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none' />
              <div className='absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none' />

              {/* Stage Grid Overlay */}
              <div
                className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none'
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Animation with Rhythmic Breathing Glow */}
              <div className='relative z-10 w-48 h-48 mb-4 flex items-center justify-center'>
                <Lottie
                  animationData={cardPayment}
                  loop={true}
                  autoplay={true}
                  glow='card'
                />
              </div>
              <p className='text-xs font-mono text-muted-foreground text-center line-clamp-2 relative z-10'>
                card-payment.json
              </p>
            </div>

            {/* Business Investor */}
            <div className='relative rounded-2xl border border-border/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center overflow-hidden shadow-xl group transition-all min-h-[320px]'>
              {/* Ambient Background Corner Glows (Exact Fintech Loader match) */}
              <div className='absolute -top-20 -left-20 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none' />
              <div className='absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none' />

              {/* Stage Grid Overlay */}
              <div
                className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none'
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Animation with Rhythmic Breathing Glow */}
              <div className='relative z-10 w-48 h-48 mb-4 flex items-center justify-center'>
                <Lottie
                  animationData={businessInvestor}
                  loop={true}
                  autoplay={true}
                  glow='investor'
                />
              </div>
              <p className='text-xs font-mono text-muted-foreground text-center line-clamp-2 relative z-10'>
                business-investor-gaining-profit-from-investment.json
              </p>
            </div>

            {/* Coin Stack */}
            <div className='relative rounded-2xl border border-border/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center overflow-hidden shadow-xl group transition-all min-h-[320px]'>
              {/* Ambient Background Corner Glows (Exact Fintech Loader match) */}
              <div className='absolute -top-20 -left-20 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none' />
              <div className='absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none' />

              {/* Stage Grid Overlay */}
              <div
                className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none'
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Animation with Rhythmic Breathing Glow */}
              <div className='relative z-10 w-48 h-48 mb-4 flex items-center justify-center'>
                <Lottie
                  animationData={coinStack}
                  loop={true}
                  autoplay={true}
                  glow='coin'
                />
              </div>
              <p className='text-xs font-mono text-muted-foreground text-center line-clamp-2 relative z-10'>
                coin-stack.json
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay Preview (Full Screen Theme-Aware) */}
      {showOverlay && (
        <div
          onClick={() => setShowOverlay(false)}
          className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground overflow-hidden transition-colors duration-300 cursor-pointer select-none'
          title='Click anywhere to dismiss overlay'
        >
          {/* Ambient Glows */}
          <div className='absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[8000ms]' />
          <div className='absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[480px] h-[480px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms]' />

          {/* Dot Matrix Pattern */}
          <div
            className='absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.08]'
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className='absolute top-6 left-1/2 -translate-x-1/2 z-20 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/40 border border-border/50 px-3 py-1 rounded-full'>
            Full-Screen Theme Preview · Click anywhere to dismiss
          </div>

          <div className='relative z-10 flex flex-col items-center'>
            <FintechLoader
              isLoading={isLoading}
              title='Processing Transaction'
              subtitle='Securing ledger state...'
              completeTitle='Transaction Complete'
              completeSubtitle='Redirecting to dashboard...'
            />
          </div>
        </div>
      )}
    </div>
  );
}
