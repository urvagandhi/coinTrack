'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Shield,
  Sparkles,
  Check,
  Copy,
  Loader2,
} from 'lucide-react';
import { FintechLoader } from '@/components/ui/feedback/FintechLoader';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <div className='min-h-screen bg-background text-foreground flex flex-col'>
      {/* Top Header */}
      <header className='border-b border-hairline bg-card/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link
            href='/design-lab'
            className='p-2 rounded-lg border border-hairline hover:bg-muted/50 transition-colors'
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-serif text-xl tracking-tight font-medium'>
                Fintech Loading Engine
              </span>
              <span className='ed-pill ed-pill-gain text-[10px]'>
                Gold Palette · Rupee Standard
              </span>
            </div>
            <p className='text-xs text-muted-foreground font-mono'>
              Full interactive lifecycle: Cards eject → float → inject on load
              completion.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <ThemeToggle />
          <button
            onClick={() => setShowOverlay(true)}
            className='ed-btn ed-btn-ghost h-9 px-4 text-xs flex items-center gap-2'
          >
            Test Modal Overlay
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className='flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Left Column: Animation Stage */}
        <section className='lg:col-span-8 flex flex-col'>
          <div className='relative flex-1 min-h-[490px] rounded-2xl border border-hairline bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl p-8 flex flex-col items-center justify-center overflow-hidden shadow-xl'>
            {/* Ambient Background Glow */}
            <div className='absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none' />

            {/* Stage Grid Overlay */}
            <div
              className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none'
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* The In-House Animation */}
            <div className='relative z-10 w-full flex justify-center py-6'>
              <FintechLoader isLoading={isLoading} />
            </div>

            {/* Floating Card Breakdown Legend */}
            <div className='absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-hairline/60 pt-3 gap-2'>
              <span className='flex items-center gap-1.5'>
                <Shield size={12} className='text-amber-500' />
                Eject & Inject Framer Motion Lifecycle
              </span>
              <span className='flex items-center gap-1.5'>
                <Sparkles size={12} className='text-emerald-500' />
                Wide Spacing · Perfect Isometric Depth
              </span>
            </div>
          </div>
        </section>

        {/* Right Column: Controls & Integration */}
        <aside className='lg:col-span-4 space-y-6'>
          {/* Controls Card */}
          <div className='rounded-2xl border border-hairline bg-card/70 backdrop-blur-md p-6 space-y-5 shadow-sm'>
            <div className='border-b border-hairline pb-3'>
              <h3 className='font-serif text-lg tracking-tight font-medium'>
                Animation Lifecycle
              </h3>
              <p className='text-xs text-muted-foreground mt-1'>
                Trigger the loading lifecycle to see the cards inject back into
                the phone and proceed to dashboard.
              </p>
            </div>

            <button
              onClick={simulateTransaction}
              disabled={simulateActive}
              className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                simulateActive
                  ? 'bg-muted text-muted-foreground border border-hairline cursor-not-allowed'
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
                <span className={isLoading ? 'text-amber-500 font-bold' : ''}>
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
          <div className='rounded-2xl border border-hairline bg-card/70 backdrop-blur-md p-6 space-y-3 shadow-sm'>
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

            <pre className='p-3.5 rounded-xl bg-muted/40 border border-hairline font-mono text-[11px] leading-relaxed overflow-x-auto text-foreground/90'>
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </aside>
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

          <div className='absolute top-6 left-1/2 -translate-x-1/2 z-20 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/40 border border-hairline px-3 py-1 rounded-full'>
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
