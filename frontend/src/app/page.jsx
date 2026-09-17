'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import { CoinTrackNavbar } from '@/components/ui/coinTrack/cointrack-navbar';
import { CoinTrackSkyBackground } from '@/components/ui/coinTrack/cointrack-sky-background';
import { CoinTrackHeroMockup } from '@/components/ui/coinTrack/cointrack-hero-mockup';
import { CoinTrackFeatures } from '@/components/ui/coinTrack/cointrack-features';
import { CoinTrackInboxSection } from '@/components/ui/coinTrack/cointrack-inbox-section';
import { CoinTrackDesignTokens } from '@/components/ui/coinTrack/cointrack-design-tokens';
import { CoinTrackPricing } from '@/components/ui/coinTrack/cointrack-pricing';
import { CoinTrackFooter } from '@/components/ui/coinTrack/cointrack-footer';

// Animation variants for smooth natural entrance without empty gaps
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

export default function CoinTrackLandingPage() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  // Global scroll listener for progress bar
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth top progress indicator
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // 3D Perspective tilt for Hero Dashboard Mockup
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start end', 'center center'],
  });

  const heroRotateX = useTransform(heroScroll, [0, 1], [10, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [0.95, 1]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [0.8, 1]);

  return (
    <div
      ref={containerRef}
      className='min-h-screen scroll-smooth bg-[#e8f1fb] text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans relative overflow-x-hidden'
    >
      {/* ── TOP SCROLL PROGRESS BAR ── */}
      <motion.div
        style={{ scaleX }}
        className='fixed top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 origin-left z-[60] pointer-events-none'
      />

      {/* ─────────────────────────────────────────────────────────────
          PINNED CLOUDY SKY BACKGROUND LAYER
          Permanently anchored to the top of the viewport with no white gap
          ───────────────────────────────────────────────────────────── */}
      <CoinTrackSkyBackground />

      {/* Floating Transparent Navbar */}
      <CoinTrackNavbar />

      {/* Main Content Body */}
      <main className='relative z-10 pt-28 sm:pt-36 md:pt-40'>
        {/* ── HERO SECTION ── */}
        <section className='px-4 sm:px-6 max-w-6xl mx-auto text-center'>
          <motion.div
            initial='hidden'
            animate='visible'
            variants={staggerContainer}
            className='max-w-4xl mx-auto'
          >
            {/* Announcement Pill (No 3.0) */}
            {/* <motion.div variants={fadeInUp} className='inline-block'>
              <Link
                href='/design-lab'
                className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-neutral-200/80 shadow-xs text-xs font-semibold text-neutral-800 mb-6 transition-transform hover:scale-[1.02]'
              >
                <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                <span className='font-display font-medium'>coinTrack is live</span>
                <span className='text-neutral-400'>·</span>
                <span className='text-neutral-500 font-normal'>
                  Institutional portfolio intelligence
                </span>
                <ArrowRight className='size-3 text-neutral-500' />
              </Link>
            </motion.div> */}

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className='font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-[82px] text-neutral-950 tracking-tight leading-[1.04]'
            >
              See your entire wealth in one clear, quiet view.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className='text-neutral-700/90 text-sm sm:text-base md:text-lg lg:text-xl font-normal max-w-2xl mx-auto mt-6 leading-relaxed'
            >
              Connect Zerodha, Upstox, and Angel One with your statutory EPF,
              PPF, mutual funds, and gold bullion. coinTrack unifies your
              complete wealth with institutional-grade FIFO tax and performance
              analytics.
            </motion.p>

            {/* Call to Action Buttons (Linking only to Design Lab sandbox) */}
            <motion.div
              variants={fadeInUp}
              className='flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8'
            >
              <Button
                asChild
                size='xl'
                className='w-full sm:w-auto rounded-full bg-neutral-950 hover:bg-neutral-850 text-white font-semibold text-sm px-7 py-3.5 shadow-lg hover:shadow-xl transition-all active:scale-[0.97]'
              >
                <Link href='/design-lab/dashboard'>
                  <span>Launch Interactive Demo</span>
                  <ArrowRight className='size-4 ml-1.5' />
                </Link>
              </Button>

              <Button
                asChild
                variant='secondary'
                size='xl'
                className='w-full sm:w-auto rounded-full bg-white/90 hover:bg-white text-neutral-900 font-semibold text-sm px-6 py-3.5 border border-neutral-200/90 shadow-sm transition-all active:scale-[0.97]'
              >
                <Link href='/design-lab'>
                  <span>Explore Design Lab Primitives</span>
                  <ArrowUpRight className='size-4 ml-1 text-neutral-500' />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* 3D Perspective Scroll Reveal Mockup Container (Dashboard kept same) */}
          <div
            ref={heroRef}
            id='overview'
            className='mt-14 sm:mt-20 scroll-mt-28'
            style={{ perspective: 1200 }}
          >
            <motion.div
              style={{
                rotateX: heroRotateX,
                scale: heroScale,
                opacity: heroOpacity,
              }}
              className='will-change-transform'
            >
              <CoinTrackHeroMockup />
            </motion.div>
          </div>
        </section>

        {/* ── SECTION 2: BENTO FEATURES (On cloudy sky) ── */}
        <CoinTrackFeatures />

        {/* ── SECTION 3: PORTFOLIO INTELLIGENCE (On cloudy sky) ── */}
        <CoinTrackInboxSection />

        {/* ── SECTION 4: SEAMLESS TRANSITION FROM CLOUD TO CRISP WHITE ── */}
        <div className='relative z-10 bg-gradient-to-b from-transparent via-white/80 to-white pt-10'>
          <CoinTrackDesignTokens />
        </div>

        {/* ── SECTION 5: PRICING (On pure crisp white backdrop) ── */}
        <div id='pricing' className='relative z-10 bg-white scroll-mt-28'>
          <CoinTrackPricing />
        </div>

        {/* ── SECTION 6: READY CTA BANNER (Links strictly to Design Lab) ── */}
        <section className='py-16 px-4 sm:px-6 relative z-10 bg-white'>
          <div className='max-w-5xl mx-auto rounded-[36px] bg-neutral-950 text-white p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-2xl'>
            <div className='absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/30 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute -left-20 -top-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none' />

            <div className='relative z-10 max-w-2xl mx-auto space-y-5'>
              <span className='text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800/60 inline-flex items-center gap-1.5'>
                <Sparkles className='size-3' />
                High-Fidelity Wealth Operating System
              </span>

              <h3 className='font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight'>
                Ready for institutional clarity over your wealth?
              </h3>

              <p className='text-neutral-400 text-sm sm:text-base leading-relaxed'>
                Join thousands of disciplined investors who aggregate their
                demats, mutual funds, and statutory portfolios on coinTrack.
              </p>

              <div className='pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5'>
                <Button
                  asChild
                  size='xl'
                  className='rounded-full bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-sm px-7 py-3.5 shadow-lg active:scale-[0.97]'
                >
                  <Link href='/design-lab/register'>
                    <span>Open Account in Design Lab</span>
                    <ArrowRight className='size-4 ml-1.5' />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant='ghost'
                  size='default'
                  className='text-neutral-300 hover:text-white font-semibold text-xs'
                >
                  <Link href='/design-lab/dashboard'>
                    Explore Sandbox Terminal →
                  </Link>
                </Button>
              </div>

              <div className='pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400'>
                <span className='flex items-center gap-1.5'>
                  <CheckCircle2 className='size-3.5 text-emerald-400' /> Zerodha
                  · Upstox · Angel One
                </span>
                <span className='flex items-center gap-1.5'>
                  <CheckCircle2 className='size-3.5 text-emerald-400' />{' '}
                  Automated FIFO Capital Gains
                </span>
                <span className='flex items-center gap-1.5'>
                  <CheckCircle2 className='size-3.5 text-emerald-400' /> Zero
                  Data Selling · Bank-Grade
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <CoinTrackFooter />
    </div>
  );
}
