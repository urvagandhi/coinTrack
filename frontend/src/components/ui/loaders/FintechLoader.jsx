'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * FintechLoader - Ultra-Premium Isometric 3D Financial Loading Animation
 *
 * Modified for final requirements:
 * - Permanent ₹ currency, Gold palette, and MD size defaults.
 * - 4 cards animate OUT of the mobile screen on load.
 * - Cards hover and bob while `isLoading` is true.
 * - When `isLoading` becomes false, cards animate back INTO the mobile screen before the component unmounts.
 * - Increased spacing between the 4 cards.
 */
export function FintechLoader({
  className,
  size = 'md',
  currency = '₹', // Hardcoded requirement
  title = 'Processing Transaction',
  subtitle = 'Securing ledger state...',
  showText = true,
  overlay = false,
  brandName = 'coinTrack',
  variant = 'gold', // Hardcoded requirement
  isLoading = true, // Controls the eject/inject lifecycle
  completeTitle = 'Transaction Complete',
  completeSubtitle = 'Redirecting to dashboard...',
}) {
  const sizeMap = {
    sm: 'w-48 max-w-[200px]',
    md: 'w-72 max-w-[320px]', // Default size requested
    lg: 'w-96 max-w-[420px]',
    xl: 'w-[480px] max-w-[540px]',
    full: 'w-full max-w-[560px]',
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  // Enforced GOLD Palette as requested
  const palette = {
    c1GradStart: '#FDE047',
    c1GradMid: '#F59E0B',
    c1GradEnd: '#D97706',
    c1Edge: '#B45309',
    c2GradStart: '#34D399',
    c2GradMid: '#10B981',
    c2GradEnd: '#059669',
    c2Edge: '#047857',
    glow: '#F59E0B',
  };

  // Card Eject/Inject Animation Definitions
  // We use SVG transforms to originate them from the exact phone center (X: 225, Y: 230)
  // and spread them further out than their original drawn positions.
  const springTransition = delay => ({
    type: 'spring',
    damping: 18,
    stiffness: 120,
    bounce: 0.4,
    delay,
  });

  const card1Variants = {
    hidden: { scale: 0.1, x: 45, y: 30, opacity: 0 },
    visible: {
      scale: 1,
      x: -25,
      y: -25,
      opacity: 1,
      transition: springTransition(0.1),
    },
    exit: {
      scale: 0.1,
      x: 45,
      y: 30,
      opacity: 0,
      transition: { duration: 0.4, ease: 'backIn' },
    },
  };

  const card2Variants = {
    hidden: { scale: 0.1, x: -57, y: 75, opacity: 0 },
    visible: {
      scale: 1,
      x: 25,
      y: -30,
      opacity: 1,
      transition: springTransition(0.25),
    },
    exit: {
      scale: 0.1,
      x: -57,
      y: 75,
      opacity: 0,
      transition: { duration: 0.4, ease: 'backIn', delay: 0.1 },
    },
  };

  const card3Variants = {
    hidden: { scale: 0.1, x: 15, y: -60, opacity: 0 },
    visible: {
      scale: 1,
      x: -15,
      y: 25,
      opacity: 1,
      transition: springTransition(0.4),
    },
    exit: {
      scale: 0.1,
      x: 15,
      y: -60,
      opacity: 0,
      transition: { duration: 0.4, ease: 'backIn', delay: 0.15 },
    },
  };

  const card4Variants = {
    hidden: { scale: 0.1, x: -40, y: -37, opacity: 0 },
    visible: {
      scale: 1,
      x: 30,
      y: 20,
      opacity: 1,
      transition: springTransition(0.55),
    },
    exit: {
      scale: 0.1,
      x: -40,
      y: -37,
      opacity: 0,
      transition: { duration: 0.4, ease: 'backIn', delay: 0.05 },
    },
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center select-none',
        selectedSize,
        className
      )}
      role='status'
      aria-label={`${title} - ${subtitle}`}
    >
      <div className='relative w-full aspect-[4/3.4] flex items-center justify-center overflow-visible'>
        <svg
          viewBox='0 0 540 460'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='w-full h-full overflow-visible drop-shadow-sm'
        >
          <defs>
            {/* Filters and Gradients */}
            <filter
              id='ft-shadow-blur'
              x='-25%'
              y='-25%'
              width='150%'
              height='150%'
            >
              <feGaussianBlur in='SourceAlpha' stdDeviation='12' />
              <feColorMatrix
                type='matrix'
                values='0 0 0 0 0.04   0 0 0 0 0.08   0 0 0 0 0.16  0 0 0 0.25 0'
              />
              <feBlend in='SourceGraphic' in2='blurOut' mode='normal' />
            </filter>

            <filter
              id='ft-card-shadow'
              x='-30%'
              y='-30%'
              width='160%'
              height='160%'
            >
              <feDropShadow
                dx='4'
                dy='10'
                stdDeviation='8'
                floodColor='#051329'
                floodOpacity='0.28'
              />
            </filter>

            <filter
              id='ft-pulse-glow'
              x='-60%'
              y='-60%'
              width='220%'
              height='220%'
            >
              <feGaussianBlur stdDeviation='4' result='glow' />
              <feMerge>
                <feMergeNode in='glow' />
                <feMergeNode in='glow' />
                <feMergeNode in='SourceGraphic' />
              </feMerge>
            </filter>

            <filter
              id='ft-gold-glow'
              x='-40%'
              y='-40%'
              width='180%'
              height='180%'
            >
              <feGaussianBlur stdDeviation='5' result='blur' />
              <feMerge>
                <feMergeNode in='blur' />
                <feMergeNode in='SourceGraphic' />
              </feMerge>
            </filter>

            {/* Base Gradients */}
            <linearGradient
              id='ft-base-top'
              x1='120'
              y1='310'
              x2='350'
              y2='425'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#EBF1F8' className='ft-base-top-0' />
              <stop
                offset='60%'
                stopColor='#DCE5F0'
                className='ft-base-top-1'
              />
              <stop
                offset='100%'
                stopColor='#CBD8E7'
                className='ft-base-top-2'
              />
            </linearGradient>

            <linearGradient
              id='ft-base-rim'
              x1='120'
              y1='320'
              x2='350'
              y2='430'
              gradientUnits='userSpaceOnUse'
            >
              <stop
                offset='0%'
                stopColor='#FFFFFF'
                stopOpacity='0.95'
                className='ft-base-rim-0'
              />
              <stop
                offset='100%'
                stopColor='#BCCBDD'
                stopOpacity='0.5'
                className='ft-base-rim-1'
              />
            </linearGradient>

            <linearGradient
              id='ft-base-extrusion'
              x1='235'
              y1='355'
              x2='235'
              y2='435'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#CAD5E3' className='ft-base-ext-0' />
              <stop
                offset='50%'
                stopColor='#B5C3D4'
                className='ft-base-ext-1'
              />
              <stop
                offset='100%'
                stopColor='#9CAEC5'
                className='ft-base-ext-2'
              />
            </linearGradient>

            <linearGradient
              id='ft-base-well'
              x1='150'
              y1='330'
              x2='320'
              y2='400'
              gradientUnits='userSpaceOnUse'
            >
              <stop
                offset='0%'
                stopColor='#C2D0E0'
                className='ft-base-well-0'
              />
              <stop
                offset='100%'
                stopColor='#DCE5F0'
                className='ft-base-well-1'
              />
            </linearGradient>

            {/* Phone Gradients */}
            <linearGradient
              id='ft-phone-back'
              x1='155'
              y1='100'
              x2='295'
              y2='320'
              gradientUnits='userSpaceOnUse'
            >
              <stop
                offset='0%'
                stopColor='#CBD5E1'
                className='ft-phone-back-0'
              />
              <stop
                offset='100%'
                stopColor='#94A3B8'
                className='ft-phone-back-1'
              />
            </linearGradient>

            <linearGradient
              id='ft-phone-screen'
              x1='175'
              y1='110'
              x2='270'
              y2='310'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#0B132B' />
              <stop offset='50%' stopColor='#0A1929' />
              <stop offset='100%' stopColor='#020617' />
            </linearGradient>

            <linearGradient
              id='ft-phone-bezel'
              x1='165'
              y1='110'
              x2='280'
              y2='320'
              gradientUnits='userSpaceOnUse'
            >
              <stop
                offset='0%'
                stopColor='#F8FAFC'
                className='ft-phone-bezel-0'
              />
              <stop
                offset='100%'
                stopColor='#E2E8F0'
                className='ft-phone-bezel-1'
              />
            </linearGradient>

            {/* Dynamic Card Gradients */}
            <linearGradient
              id='ft-c1-face'
              x1='150'
              y1='130'
              x2='220'
              y2='280'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor={palette.c1GradStart} />
              <stop offset='45%' stopColor={palette.c1GradMid} />
              <stop offset='100%' stopColor={palette.c1GradEnd} />
            </linearGradient>
            <linearGradient
              id='ft-c1-bevel-light'
              x1='150'
              y1='130'
              x2='210'
              y2='150'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#FFFFFF' stopOpacity='0.85' />
              <stop offset='100%' stopColor='#FFFFFF' stopOpacity='0.1' />
            </linearGradient>

            <linearGradient
              id='ft-c2-face'
              x1='250'
              y1='110'
              x2='310'
              y2='210'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor={palette.c2GradStart} />
              <stop offset='55%' stopColor={palette.c2GradMid} />
              <stop offset='100%' stopColor={palette.c2GradEnd} />
            </linearGradient>
            <linearGradient
              id='ft-c2-chart-area'
              x1='260'
              y1='135'
              x2='260'
              y2='180'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#FFFFFF' stopOpacity='0.35' />
              <stop offset='100%' stopColor='#FFFFFF' stopOpacity='0' />
            </linearGradient>

            <linearGradient
              id='ft-c3-face'
              x1='180'
              y1='230'
              x2='240'
              y2='340'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor={palette.c2GradStart} />
              <stop offset='60%' stopColor={palette.c2GradMid} />
              <stop offset='100%' stopColor={palette.c2GradEnd} />
            </linearGradient>
            <linearGradient id='ft-bar-gradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#FFFFFF' stopOpacity='1' />
              <stop offset='70%' stopColor='#FEF08A' stopOpacity='0.95' />
              <stop offset='100%' stopColor='#FBBF24' stopOpacity='0.8' />
            </linearGradient>

            <linearGradient
              id='ft-c4-face'
              x1='240'
              y1='220'
              x2='290'
              y2='315'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor={palette.c1GradStart} />
              <stop offset='50%' stopColor={palette.c1GradMid} />
              <stop offset='100%' stopColor={palette.c1GradEnd} />
            </linearGradient>

            <radialGradient id='ft-coin-face' cx='50%' cy='45%' r='50%'>
              <stop offset='0%' stopColor='#FEF08A' />
              <stop offset='45%' stopColor='#FBBF24' />
              <stop offset='85%' stopColor='#D97706' />
              <stop offset='100%' stopColor='#B45309' />
            </radialGradient>
            <linearGradient id='ft-coin-rim' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#FDE047' />
              <stop offset='50%' stopColor='#D97706' />
              <stop offset='100%' stopColor='#78350F' />
            </linearGradient>

            <linearGradient
              id='ft-terminal-top'
              x1='375'
              y1='215'
              x2='455'
              y2='265'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#EDF2F7' className='ft-term-top-0' />
              <stop
                offset='100%'
                stopColor='#D6E0EC'
                className='ft-term-top-1'
              />
            </linearGradient>
            <linearGradient
              id='ft-terminal-side'
              x1='375'
              y1='240'
              x2='375'
              y2='275'
              gradientUnits='userSpaceOnUse'
            >
              <stop
                offset='0%'
                stopColor='#B5C5D8'
                className='ft-term-side-0'
              />
              <stop
                offset='100%'
                stopColor='#96A8BD'
                className='ft-term-side-1'
              />
            </linearGradient>
            <linearGradient
              id='ft-button-well'
              x1='385'
              y1='245'
              x2='440'
              y2='265'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#0F172A' />
              <stop offset='100%' stopColor='#1E293B' />
            </linearGradient>

            <linearGradient id='ft-wire-pulse-glow' x1='0' y1='0' x2='1' y2='0'>
              <stop offset='0%' stopColor='#FB923C' stopOpacity='0' />
              <stop offset='60%' stopColor='#F97316' stopOpacity='0.85' />
              <stop offset='100%' stopColor='#FF4500' stopOpacity='1' />
            </linearGradient>
            <linearGradient
              id='ft-screen-shimmer'
              x1='0'
              y1='0'
              x2='100'
              y2='100'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#FFFFFF' stopOpacity='0' />
              <stop offset='50%' stopColor='#FFFFFF' stopOpacity='0.25' />
              <stop offset='100%' stopColor='#FFFFFF' stopOpacity='0' />
            </linearGradient>

            <linearGradient id='ft-phone-card-grad' x1='0' y1='0' x2='1' y2='1'>
              <stop offset='0%' stopColor='#1E293B' stopOpacity='0.85' />
              <stop offset='100%' stopColor='#0B132B' stopOpacity='0.9' />
            </linearGradient>
            <linearGradient
              id='ft-phone-card-border'
              x1='0'
              y1='0'
              x2='1'
              y2='1'
            >
              <stop offset='0%' stopColor='#38BDF8' stopOpacity='0.45' />
              <stop offset='100%' stopColor='#1E293B' stopOpacity='0.25' />
            </linearGradient>
            <linearGradient id='ft-phone-sparkline' x1='0' y1='0' x2='1' y2='0'>
              <stop offset='0%' stopColor='#10B981' />
              <stop offset='50%' stopColor='#38BDF8' />
              <stop offset='100%' stopColor='#F59E0B' />
            </linearGradient>
            <linearGradient
              id='ft-phone-chart-glow'
              x1='0'
              y1='0'
              x2='0'
              y2='1'
            >
              <stop offset='0%' stopColor='#10B981' stopOpacity='0.35' />
              <stop offset='100%' stopColor='#10B981' stopOpacity='0.0' />
            </linearGradient>

            {/* Seamless Natural Cable Path */}
            <path
              id='ft-cable-path'
              d='M 176 144 C 120 125, 75 190, 105 255 C 135 320, 260 335, 335 295 C 350 285, 362 268, 370 256'
            />
          </defs>

          {/* Embedded Dynamic CSS for the continuous hover/bobbing AFTER they enter */}
          <style>{`
            @keyframes ftBob1 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-13px) rotate(-0.6deg); }
            }
            @keyframes ftBob2 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-16px) rotate(0.9deg); }
            }
            @keyframes ftBob3 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-10px) rotate(-0.4deg); }
            }
            @keyframes ftBob4 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-14px) rotate(0.8deg); }
            }
            @keyframes ftCoinFloat {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-9px) scale(1.04); }
            }
            @keyframes ftBar1 {
              0%, 100% { height: 14px; y: 46px; }
              50% { height: 28px; y: 32px; }
            }
            @keyframes ftBar2 {
              0%, 100% { height: 26px; y: 34px; }
              50% { height: 44px; y: 16px; }
            }
            @keyframes ftBar3 {
              0%, 100% { height: 38px; y: 22px; }
              50% { height: 50px; y: 10px; }
            }
            @keyframes ftBar4 {
              0%, 100% { height: 20px; y: 40px; }
              50% { height: 36px; y: 24px; }
            }
            @keyframes ftGraphFlow {
              0% { stroke-dashoffset: 120; }
              50% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -120; }
            }
            /* Light Theme Defaults for SVG */
            .ft-base-top-0 { stop-color: #EBF1F8; }
            .ft-base-top-1 { stop-color: #DCE5F0; }
            .ft-base-top-2 { stop-color: #CBD8E7; }
            .ft-base-rim-0 { stop-color: #FFFFFF; }
            .ft-base-rim-1 { stop-color: #BCCBDD; }
            .ft-base-ext-0 { stop-color: #CAD5E3; }
            .ft-base-ext-1 { stop-color: #B5C3D4; }
            .ft-base-ext-2 { stop-color: #9CAEC5; }
            .ft-base-well-0 { stop-color: #C2D0E0; }
            .ft-base-well-1 { stop-color: #DCE5F0; }
            .ft-phone-back-0 { stop-color: #E2E8F0; }
            .ft-phone-back-1 { stop-color: #94A3B8; }
            .ft-phone-bezel-0 { stop-color: #FFFFFF; }
            .ft-phone-bezel-1 { stop-color: #CBD5E1; }
            .ft-term-top-0 { stop-color: #F1F5F9; }
            .ft-term-top-1 { stop-color: #CBD5E1; }
            .ft-term-side-0 { stop-color: #94A3B8; }
            .ft-term-side-1 { stop-color: #64748B; }

            /* Dark Theme Overrides for SVG */
            :global(.dark) .ft-base-top-0, .dark .ft-base-top-0, [data-theme='dark'] .ft-base-top-0 { stop-color: #243042; }
            :global(.dark) .ft-base-top-1, .dark .ft-base-top-1, [data-theme='dark'] .ft-base-top-1 { stop-color: #1E2837; }
            :global(.dark) .ft-base-top-2, .dark .ft-base-top-2, [data-theme='dark'] .ft-base-top-2 { stop-color: #18202C; }
            :global(.dark) .ft-base-rim-0, .dark .ft-base-rim-0, [data-theme='dark'] .ft-base-rim-0 { stop-color: #3B485C; }
            :global(.dark) .ft-base-rim-1, .dark .ft-base-rim-1, [data-theme='dark'] .ft-base-rim-1 { stop-color: #111722; }
            :global(.dark) .ft-base-ext-0, .dark .ft-base-ext-0, [data-theme='dark'] .ft-base-ext-0 { stop-color: #1C2533; }
            :global(.dark) .ft-base-ext-1, .dark .ft-base-ext-1, [data-theme='dark'] .ft-base-ext-1 { stop-color: #141C28; }
            :global(.dark) .ft-base-ext-2, .dark .ft-base-ext-2, [data-theme='dark'] .ft-base-ext-2 { stop-color: #0F151F; }
            :global(.dark) .ft-base-well-0, .dark .ft-base-well-0, [data-theme='dark'] .ft-base-well-0 { stop-color: #151D29; }
            :global(.dark) .ft-base-well-1, .dark .ft-base-well-1, [data-theme='dark'] .ft-base-well-1 { stop-color: #222E3F; }
            :global(.dark) .ft-phone-back-0, .dark .ft-phone-back-0, [data-theme='dark'] .ft-phone-back-0 { stop-color: #334155; }
            :global(.dark) .ft-phone-back-1, .dark .ft-phone-back-1, [data-theme='dark'] .ft-phone-back-1 { stop-color: #1E293B; }
            :global(.dark) .ft-phone-bezel-0, .dark .ft-phone-bezel-0, [data-theme='dark'] .ft-phone-bezel-0 { stop-color: #475569; }
            :global(.dark) .ft-phone-bezel-1, .dark .ft-phone-bezel-1, [data-theme='dark'] .ft-phone-bezel-1 { stop-color: #1E293B; }
            :global(.dark) .ft-term-top-0, .dark .ft-term-top-0, [data-theme='dark'] .ft-term-top-0 { stop-color: #283548; }
            :global(.dark) .ft-term-top-1, .dark .ft-term-top-1, [data-theme='dark'] .ft-term-top-1 { stop-color: #1A2332; }
            :global(.dark) .ft-term-side-0, .dark .ft-term-side-0, [data-theme='dark'] .ft-term-side-0 { stop-color: #17202D; }
            :global(.dark) .ft-term-side-1, .dark .ft-term-side-1, [data-theme='dark'] .ft-term-side-1 { stop-color: #0F1622; }

            .ft-card-1 { animation: ftBob1 3.2s ease-in-out infinite; transform-origin: center; }
            .ft-card-2 { animation: ftBob2 3.9s ease-in-out infinite -1.8s; transform-origin: center; }
            .ft-card-3 { animation: ftBob3 2.8s ease-in-out infinite -0.9s; transform-origin: center; }
            .ft-card-4 { animation: ftBob4 3.5s ease-in-out infinite -2.3s; transform-origin: center; }
            .ft-coin-anim { animation: ftCoinFloat 2.4s ease-in-out infinite; transform-origin: 412px 205px; }
            .ft-bar-anim-1 { animation: ftBar1 2.2s ease-in-out infinite; }
            .ft-bar-anim-2 { animation: ftBar2 2.2s ease-in-out infinite 0.22s; }
            .ft-bar-anim-3 { animation: ftBar3 2.2s ease-in-out infinite 0.45s; }
            .ft-bar-anim-4 { animation: ftBar4 2.2s ease-in-out infinite 0.68s; }
            .ft-trend-anim { stroke-dasharray: 120; animation: ftGraphFlow 3.4s ease-in-out infinite; }
            .ft-laser-cable { stroke-dasharray: 40 180; animation: ftLaserBeam 2.2s linear infinite; }
            .ft-screen-scanner { animation: ftScreenSweep 3.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
            @keyframes ftLaserBeam {
              0% { stroke-dashoffset: 220; }
              100% { stroke-dashoffset: 0; }
            }
          `}</style>

          {/* ========================================================= */}
          {/* 1. PEDESTAL & PHONE & WIRE (ALWAYS VISIBLE) */}
          {/* ========================================================= */}
          <g id='static-environment-layer'>
            {/* Pedestal */}
            <g id='pedestal-layer'>
              <ellipse
                cx='240'
                cy='382'
                rx='170'
                ry='68'
                fill='#0B132B'
                opacity='0.18'
                filter='url(#ft-shadow-blur)'
              />
              <ellipse
                cx='240'
                cy='380'
                rx='138'
                ry='55'
                fill='#0F172A'
                opacity='0.12'
              />
              <path
                d='M 98 358 C 98 396, 162 428, 240 428 C 318 428, 382 396, 382 358 L 382 384 C 382 422, 318 454, 240 454 C 162 454, 98 422, 98 384 Z'
                fill='url(#ft-base-extrusion)'
              />
              <ellipse
                cx='240'
                cy='358'
                rx='142'
                ry='57'
                fill='url(#ft-base-top)'
                stroke='url(#ft-base-rim)'
                strokeWidth='1.8'
              />
              <ellipse
                cx='240'
                cy='358'
                rx='120'
                ry='47'
                fill='url(#ft-base-well)'
                stroke='#A9B9CC'
                strokeOpacity='0.55'
                strokeWidth='1.2'
                className='dark:stroke-[#2B384B]'
              />
              <ellipse
                cx='240'
                cy='357'
                rx='100'
                ry='39'
                fill='none'
                stroke='#FFFFFF'
                strokeOpacity='0.45'
                strokeWidth='1'
                className='dark:stroke-[#40526B] dark:stroke-opacity-30'
              />
            </g>

            {/* Wire */}
            <g id='cable-layer'>
              {/* Drop Shadow */}
              <path
                d='M 176 144 C 120 125, 75 190, 105 255 C 135 320, 260 335, 335 295 C 350 285, 362 268, 370 256'
                fill='none'
                stroke='#000000'
                strokeOpacity='0.12'
                strokeWidth='5'
                transform='translate(4, 16)'
                filter='url(#ft-shadow-blur)'
              />

              {/* Outer Cable Sleeve */}
              <path
                d='M 176 144 C 120 125, 75 190, 105 255 C 135 320, 260 335, 335 295 C 350 285, 362 268, 370 256'
                fill='none'
                stroke='#64748B'
                strokeOpacity='0.75'
                strokeWidth='3.2'
                strokeLinecap='round'
                className='dark:stroke-[#475569]'
              />

              {/* Glowing Laser Fiber Core */}
              <path
                d='M 176 144 C 120 125, 75 190, 105 255 C 135 320, 260 335, 335 295 C 350 285, 362 268, 370 256'
                fill='none'
                stroke='url(#ft-wire-pulse-glow)'
                strokeWidth='3.4'
                strokeLinecap='round'
                className='ft-laser-cable'
              />

              {/* Continuous Dual-Photon Data Pulse Stream */}
              <g>
                <circle
                  r='8'
                  fill='#FF5722'
                  opacity='0.35'
                  filter='url(#ft-pulse-glow)'
                >
                  <animateMotion
                    dur='2.2s'
                    repeatCount='indefinite'
                    keyPoints='0;1'
                    keyTimes='0;1'
                    calcMode='linear'
                  >
                    <mpath href='#ft-cable-path' />
                  </animateMotion>
                </circle>
                <circle r='4' fill='#FFA726'>
                  <animateMotion
                    dur='2.2s'
                    repeatCount='indefinite'
                    keyPoints='0;1'
                    keyTimes='0;1'
                    calcMode='linear'
                  >
                    <mpath href='#ft-cable-path' />
                  </animateMotion>
                </circle>
                <circle r='1.8' fill='#FFFFFF'>
                  <animateMotion
                    dur='2.2s'
                    repeatCount='indefinite'
                    keyPoints='0;1'
                    keyTimes='0;1'
                    calcMode='linear'
                  >
                    <mpath href='#ft-cable-path' />
                  </animateMotion>
                </circle>

                <circle
                  r='6'
                  fill='#FF5722'
                  opacity='0.3'
                  filter='url(#ft-pulse-glow)'
                >
                  <animateMotion
                    dur='2.2s'
                    begin='1.1s'
                    repeatCount='indefinite'
                    keyPoints='0;1'
                    keyTimes='0;1'
                    calcMode='linear'
                  >
                    <mpath href='#ft-cable-path' />
                  </animateMotion>
                </circle>
                <circle r='3' fill='#FFA726'>
                  <animateMotion
                    dur='2.2s'
                    begin='1.1s'
                    repeatCount='indefinite'
                    keyPoints='0;1'
                    keyTimes='0;1'
                    calcMode='linear'
                  >
                    <mpath href='#ft-cable-path' />
                  </animateMotion>
                </circle>
                <circle r='1.4' fill='#FFFFFF'>
                  <animateMotion
                    dur='2.2s'
                    begin='1.1s'
                    repeatCount='indefinite'
                    keyPoints='0;1'
                    keyTimes='0;1'
                    calcMode='linear'
                  >
                    <mpath href='#ft-cable-path' />
                  </animateMotion>
                </circle>
              </g>
            </g>

            {/* Phone */}
            <g id='phone-hub-layer'>
              <path
                d='M 195 330 L 245 358 L 278 339 L 230 313 Z'
                fill='#0B132B'
                opacity='0.25'
                filter='url(#ft-shadow-blur)'
              />
              <path
                d='M 255 106 L 265 113 L 282 328 L 272 321 Z'
                fill='#94A3B8'
                className='dark:fill-[#1E293B]'
              />
              <path
                d='M 204 345 L 214 352 L 282 328 L 272 321 Z'
                fill='#7B8C9E'
                className='dark:fill-[#0F172A]'
              />
              <path
                d='M 176 142 C 174 132, 182 122, 192 118 L 242 99 C 251 96, 260 100, 262 109 L 281 315 C 283 324, 275 333, 265 337 L 215 356 C 205 360, 196 355, 194 346 Z'
                fill='url(#ft-phone-back)'
                stroke='url(#ft-phone-bezel)'
                strokeWidth='2.2'
              />
              <g clipPath='url(#ft-phone-screen-clip)'>
                <clipPath id='ft-phone-screen-clip'>
                  <path d='M 181 148 C 180 141, 186 133, 193 130 L 237 113 C 244 110, 251 114, 253 121 L 270 306 C 272 313, 266 321, 259 324 L 215 341 C 207 344, 200 340, 198 333 Z' />
                </clipPath>

                {/* Screen Base Glass & Lighting */}
                <path
                  d='M 170 95 L 265 75 L 285 350 L 185 370 Z'
                  fill='url(#ft-phone-screen)'
                />
                <ellipse
                  cx='225'
                  cy='225'
                  rx='35'
                  ry='85'
                  fill='#0284C7'
                  opacity='0.08'
                />

                {/* Ultra-Precise Isometric Fintech Dashboard UI (Aligned to Phone Face) */}
                <g transform='matrix(1, -0.3864, 0.1043, 1, 193, 130)'>
                  {/* Dynamic Island Notch & Status Bar */}
                  <rect
                    x='15'
                    y='4.5'
                    width='14'
                    height='3.4'
                    rx='1.7'
                    fill='#020617'
                    stroke='#1E293B'
                    strokeWidth='0.35'
                  />
                  <circle cx='24' cy='6.2' r='0.7' fill='#0F172A' />
                  <circle
                    cx='19'
                    cy='6.2'
                    r='0.5'
                    fill='#10B981'
                    opacity='0.9'
                  />

                  <text
                    x='4.5'
                    y='7.5'
                    fill='#94A3B8'
                    fontSize='3.2'
                    fontWeight='700'
                    fontFamily='system-ui, sans-serif'
                  >
                    9:41
                  </text>

                  <line
                    x1='33'
                    y1='8'
                    x2='33'
                    y2='7'
                    stroke='#38BDF8'
                    strokeWidth='0.5'
                    strokeLinecap='round'
                  />
                  <line
                    x1='34.5'
                    y1='8'
                    x2='34.5'
                    y2='6'
                    stroke='#38BDF8'
                    strokeWidth='0.5'
                    strokeLinecap='round'
                  />
                  <line
                    x1='36'
                    y1='8'
                    x2='36'
                    y2='5'
                    stroke='#38BDF8'
                    strokeWidth='0.5'
                    strokeLinecap='round'
                  />
                  <rect
                    x='37.5'
                    y='5.5'
                    width='3.5'
                    height='2.2'
                    rx='0.5'
                    fill='none'
                    stroke='#94A3B8'
                    strokeWidth='0.35'
                  />
                  <rect
                    x='38.1'
                    y='6.1'
                    width='2'
                    height='1'
                    rx='0.2'
                    fill='#10B981'
                  />

                  {/* App Brand Header */}
                  <circle cx='5.5' cy='17' r='2.2' fill='url(#ft-coin-face)' />
                  <text
                    x='5.5'
                    y='17.8'
                    textAnchor='middle'
                    dominantBaseline='central'
                    fill='#FFFFFF'
                    fontSize='2.2'
                    fontWeight='900'
                  >
                    ₹
                  </text>
                  <text
                    x='9.5'
                    y='17.8'
                    dominantBaseline='central'
                    fill='#F8FAFC'
                    fontSize='3.2'
                    fontWeight='800'
                    letterSpacing='0.3'
                    fontFamily='system-ui, sans-serif'
                  >
                    COINTRACK
                  </text>

                  <rect
                    x='31'
                    y='15'
                    width='9.5'
                    height='4'
                    rx='2'
                    fill='#10B981'
                    fillOpacity='0.18'
                    stroke='#10B981'
                    strokeWidth='0.35'
                  />
                  <circle cx='33.2' cy='17' r='0.7' fill='#10B981' />
                  <text
                    x='35'
                    y='17.8'
                    dominantBaseline='central'
                    fill='#34D399'
                    fontSize='2'
                    fontWeight='800'
                  >
                    SYNC
                  </text>

                  {/* Hero Portfolio Balance Card */}
                  <rect
                    x='3'
                    y='24'
                    width='38'
                    height='42'
                    rx='4.5'
                    fill='url(#ft-phone-card-grad)'
                    stroke='url(#ft-phone-card-border)'
                    strokeWidth='0.5'
                  />
                  <text
                    x='6'
                    y='31'
                    fill='#94A3B8'
                    fontSize='2.4'
                    fontWeight='700'
                    letterSpacing='0.3'
                  >
                    TOTAL ASSETS
                  </text>
                  <rect
                    x='28'
                    y='27.5'
                    width='10.5'
                    height='4'
                    rx='2'
                    fill='#10B981'
                    fillOpacity='0.2'
                  />
                  <text
                    x='33.2'
                    y='30.2'
                    textAnchor='middle'
                    dominantBaseline='central'
                    fill='#10B981'
                    fontSize='2.2'
                    fontWeight='800'
                  >
                    +18.4%
                  </text>

                  <text
                    x='6'
                    y='40'
                    fill='#FFFFFF'
                    fontSize='6.5'
                    fontWeight='900'
                    fontFamily='system-ui, sans-serif'
                  >
                    ₹8,42,950
                  </text>
                  <text
                    x='6'
                    y='45'
                    fill='#FBBF24'
                    fillOpacity='0.9'
                    fontSize='2.5'
                    fontWeight='600'
                    fontFamily='monospace'
                  >
                    ● 2.4580 BTC
                  </text>

                  {/* Micro Sparkline Chart */}
                  <path
                    d='M 6 59 L 11 56 L 16 58 L 22 53 L 27 55 L 32 49 L 37 51 L 37 63 L 6 63 Z'
                    fill='url(#ft-phone-chart-glow)'
                  />
                  <path
                    d='M 6 59 L 11 56 L 16 58 L 22 53 L 27 55 L 32 49 L 37 51'
                    fill='none'
                    stroke='url(#ft-phone-sparkline)'
                    strokeWidth='0.9'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <circle cx='37' cy='51' r='1.2' fill='#F59E0B' />
                  <circle
                    cx='37'
                    cy='51'
                    r='2.2'
                    fill='#F59E0B'
                    opacity='0.3'
                  />

                  {/* Quick Action Buttons */}
                  <circle
                    cx='9'
                    cy='74'
                    r='4'
                    fill='#1E293B'
                    stroke='#334155'
                    strokeWidth='0.4'
                  />
                  <path
                    d='M 9 76.2 L 9 71.8 M 7.5 73.3 L 9 71.8 L 10.5 73.3'
                    fill='none'
                    stroke='#38BDF8'
                    strokeWidth='0.6'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <text
                    x='9'
                    y='81.5'
                    textAnchor='middle'
                    fill='#94A3B8'
                    fontSize='2.2'
                    fontWeight='600'
                  >
                    Send
                  </text>

                  <circle
                    cx='22'
                    cy='74'
                    r='4'
                    fill='#1E293B'
                    stroke='#334155'
                    strokeWidth='0.4'
                  />
                  <path
                    d='M 22 71.8 L 22 76.2 M 20.5 74.7 L 22 76.2 L 23.5 74.7'
                    fill='none'
                    stroke='#10B981'
                    strokeWidth='0.6'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <text
                    x='22'
                    y='81.5'
                    textAnchor='middle'
                    fill='#94A3B8'
                    fontSize='2.2'
                    fontWeight='600'
                  >
                    Receive
                  </text>

                  <circle
                    cx='35'
                    cy='74'
                    r='4'
                    fill='#1E293B'
                    stroke='#334155'
                    strokeWidth='0.4'
                  />
                  <path
                    d='M 33 73.2 L 37 73.2 M 35.8 72 L 37 73.2 L 35.8 74.4'
                    fill='none'
                    stroke='#F59E0B'
                    strokeWidth='0.55'
                    strokeLinecap='round'
                  />
                  <path
                    d='M 37 74.8 L 33 74.8 M 34.2 73.6 L 33 74.8 L 34.2 76'
                    fill='none'
                    stroke='#F59E0B'
                    strokeWidth='0.55'
                    strokeLinecap='round'
                  />
                  <text
                    x='35'
                    y='81.5'
                    textAnchor='middle'
                    fill='#94A3B8'
                    fontSize='2.2'
                    fontWeight='600'
                  >
                    Swap
                  </text>

                  {/* Security Terminal Sync Banner */}
                  <rect
                    x='3'
                    y='86'
                    width='38'
                    height='18'
                    rx='4'
                    fill='#0B1E2E'
                    stroke='#0284C7'
                    strokeOpacity='0.45'
                    strokeWidth='0.45'
                  />
                  <circle
                    cx='8.5'
                    cy='95'
                    r='3.5'
                    fill='#0284C7'
                    fillOpacity='0.25'
                  />
                  <path
                    d='M 6.8 95 L 8 96.3 L 10.3 93.8'
                    fill='none'
                    stroke='#38BDF8'
                    strokeWidth='0.75'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <text
                    x='14'
                    y='93.5'
                    fill='#F8FAFC'
                    fontSize='2.7'
                    fontWeight='800'
                  >
                    2FA VERIFIED
                  </text>
                  <text
                    x='14'
                    y='97'
                    fill='#38BDF8'
                    fontSize='2'
                    fontWeight='600'
                  >
                    Terminal Synchronized
                  </text>
                  <rect
                    x='14'
                    y='99'
                    width='23'
                    height='1.8'
                    rx='0.9'
                    fill='#1E293B'
                  />
                  <rect
                    x='14'
                    y='99'
                    width='19'
                    height='1.8'
                    rx='0.9'
                    fill='#10B981'
                  />

                  {/* Market Watchlist Card */}
                  <rect
                    x='3'
                    y='108'
                    width='38'
                    height='64'
                    rx='4.5'
                    fill='url(#ft-phone-card-grad)'
                    stroke='url(#ft-phone-card-border)'
                    strokeWidth='0.45'
                  />
                  <text
                    x='6'
                    y='114.5'
                    fill='#94A3B8'
                    fontSize='2.5'
                    fontWeight='700'
                    letterSpacing='0.3'
                  >
                    MARKETS
                  </text>
                  <circle cx='37' cy='113.5' r='0.7' fill='#10B981' />

                  {/* Row 1: BTC */}
                  <g transform='translate(5, 117)'>
                    <circle cx='3' cy='4' r='2.8' fill='url(#ft-coin-face)' />
                    <text
                      x='7.5'
                      y='4.2'
                      fill='#FFFFFF'
                      fontSize='2.6'
                      fontWeight='800'
                    >
                      Bitcoin
                    </text>
                    <text x='7.5' y='7.2' fill='#64748B' fontSize='1.9'>
                      BTC
                    </text>
                    <text
                      x='31'
                      y='4.2'
                      textAnchor='end'
                      fill='#FFFFFF'
                      fontSize='2.6'
                      fontWeight='700'
                    >
                      ₹58.4L
                    </text>
                    <text
                      x='31'
                      y='7.2'
                      textAnchor='end'
                      fill='#10B981'
                      fontSize='1.9'
                      fontWeight='700'
                    >
                      +3.8%
                    </text>
                  </g>

                  <line
                    x1='6'
                    y1='131'
                    x2='38'
                    y2='131'
                    stroke='#334155'
                    strokeOpacity='0.3'
                    strokeWidth='0.3'
                  />

                  {/* Row 2: ETH */}
                  <g transform='translate(5, 133)'>
                    <circle
                      cx='3'
                      cy='4'
                      r='2.8'
                      fill='#38BDF8'
                      fillOpacity='0.25'
                      stroke='#38BDF8'
                      strokeWidth='0.35'
                    />
                    <path
                      d='M 3 2.5 L 4.1 3.9 L 3 4.6 L 1.9 3.9 Z M 3 5 L 4.1 4.3 L 3 5.8 L 1.9 4.3 Z'
                      fill='#38BDF8'
                    />
                    <text
                      x='7.5'
                      y='4.2'
                      fill='#FFFFFF'
                      fontSize='2.6'
                      fontWeight='800'
                    >
                      Ethereum
                    </text>
                    <text x='7.5' y='7.2' fill='#64748B' fontSize='1.9'>
                      ETH
                    </text>
                    <text
                      x='31'
                      y='4.2'
                      textAnchor='end'
                      fill='#FFFFFF'
                      fontSize='2.6'
                      fontWeight='700'
                    >
                      ₹2.85L
                    </text>
                    <text
                      x='31'
                      y='7.2'
                      textAnchor='end'
                      fill='#10B981'
                      fontSize='1.9'
                      fontWeight='700'
                    >
                      +1.9%
                    </text>
                  </g>

                  <line
                    x1='6'
                    y1='147'
                    x2='38'
                    y2='147'
                    stroke='#334155'
                    strokeOpacity='0.3'
                    strokeWidth='0.3'
                  />

                  {/* Row 3: INR Vault */}
                  <g transform='translate(5, 149)'>
                    <circle
                      cx='3'
                      cy='4'
                      r='2.8'
                      fill='#10B981'
                      fillOpacity='0.2'
                      stroke='#10B981'
                      strokeWidth='0.35'
                    />
                    <text
                      x='3'
                      y='4.8'
                      textAnchor='middle'
                      dominantBaseline='central'
                      fill='#10B981'
                      fontSize='2.8'
                      fontWeight='900'
                    >
                      ₹
                    </text>
                    <text
                      x='7.5'
                      y='4.2'
                      fill='#FFFFFF'
                      fontSize='2.6'
                      fontWeight='800'
                    >
                      INR Vault
                    </text>
                    <text x='7.5' y='7.2' fill='#64748B' fontSize='1.9'>
                      Yield 8.2%
                    </text>
                    <text
                      x='31'
                      y='4.2'
                      textAnchor='end'
                      fill='#FFFFFF'
                      fontSize='2.6'
                      fontWeight='700'
                    >
                      ₹1.20L
                    </text>
                    <text
                      x='31'
                      y='7.2'
                      textAnchor='end'
                      fill='#38BDF8'
                      fontSize='1.9'
                      fontWeight='700'
                    >
                      Active
                    </text>
                  </g>

                  {/* Floating Bottom Dock */}
                  <rect
                    x='4'
                    y='176'
                    width='36'
                    height='12'
                    rx='6'
                    fill='#0B132B'
                    fillOpacity='0.92'
                    stroke='#334155'
                    strokeWidth='0.4'
                  />
                  <circle
                    cx='9'
                    cy='182'
                    r='3.2'
                    fill='#38BDF8'
                    fillOpacity='0.22'
                  />
                  <path
                    d='M 7.5 183 L 7.5 181.6 L 9 180.4 L 10.5 181.6 L 10.5 183 Z'
                    fill='none'
                    stroke='#38BDF8'
                    strokeWidth='0.55'
                    strokeLinejoin='round'
                  />

                  <path
                    d='M 16.5 183.2 L 16.5 181.5 M 18 183.2 L 18 180 M 19.5 183.2 L 19.5 181'
                    stroke='#94A3B8'
                    strokeWidth='0.55'
                    strokeLinecap='round'
                  />

                  <rect
                    x='24.5'
                    y='180.5'
                    width='4'
                    height='3'
                    rx='0.6'
                    fill='none'
                    stroke='#94A3B8'
                    strokeWidth='0.45'
                  />
                  <line
                    x1='24.5'
                    y1='181.6'
                    x2='28.5'
                    y2='181.6'
                    stroke='#94A3B8'
                    strokeWidth='0.45'
                  />

                  <circle
                    cx='33'
                    cy='181.3'
                    r='1.1'
                    fill='none'
                    stroke='#94A3B8'
                    strokeWidth='0.45'
                  />
                  <path
                    d='M 31.5 183.6 C 31.5 182.6 32.2 182.4 33 182.4 C 33.8 182.4 34.5 182.6 34.5 183.6'
                    fill='none'
                    stroke='#94A3B8'
                    strokeWidth='0.45'
                  />

                  {/* Home Indicator */}
                  <rect
                    x='15'
                    y='193'
                    width='14'
                    height='1.2'
                    rx='0.6'
                    fill='#FFFFFF'
                    opacity='0.4'
                  />
                </g>

                {/* Laser Scanner Light Sweep */}
                <rect
                  x='165'
                  y='95'
                  width='130'
                  height='38'
                  fill='url(#ft-screen-shimmer)'
                  className='ft-screen-scanner'
                  pointerEvents='none'
                />
                {/* Diagonal Glass Sheen */}
                <path
                  d='M 183 145 L 243 120 L 220 280 L 175 295 Z'
                  fill='url(#ft-c1-bevel-light)'
                  opacity='0.04'
                  pointerEvents='none'
                />
              </g>
              <path
                d='M 213 121 L 225 117'
                stroke='#64748B'
                strokeWidth='2.4'
                strokeLinecap='round'
                className='dark:stroke-[#334155]'
              />
              {/* Phone Physical Cable Socket */}
              <g id='phone-cable-socket'>
                <ellipse
                  cx='176'
                  cy='144'
                  rx='3'
                  ry='5'
                  fill='#334155'
                  stroke='#64748B'
                  strokeWidth='0.8'
                />
                <circle
                  cx='176'
                  cy='144'
                  r='1.8'
                  fill='#F97316'
                  filter='url(#ft-pulse-glow)'
                />
              </g>
            </g>

            {/* Terminal and Biometric Security Key Button */}
            <g id='terminal-coin-layer'>
              {/* Base Drop Shadow */}
              <ellipse
                cx='412'
                cy='292'
                rx='44'
                ry='20'
                fill='#0B132B'
                opacity='0.22'
                filter='url(#ft-shadow-blur)'
              />

              {/* Metallic Cylinder Body */}
              <path
                d='M 370 252 C 370 266, 389 278, 412 278 C 435 278, 454 266, 454 252 L 454 268 C 454 282, 435 294, 412 294 C 389 294, 370 282, 370 268 Z'
                fill='url(#ft-terminal-side)'
              />

              {/* Top Outer Rim */}
              <ellipse
                cx='412'
                cy='252'
                rx='42'
                ry='18'
                fill='url(#ft-terminal-top)'
                stroke='url(#ft-base-rim)'
                strokeWidth='1.4'
              />

              {/* Recessed Tactile Button Well */}
              <ellipse
                cx='412'
                cy='252'
                rx='33'
                ry='14'
                fill='url(#ft-button-well)'
                stroke='#94A3B8'
                strokeWidth='0.8'
                strokeOpacity='0.4'
              />

              {/* Concentric Illuminated Glowing Status Rings */}
              <ellipse
                cx='412'
                cy='252'
                rx='25'
                ry='10.5'
                fill='none'
                stroke='#F59E0B'
                strokeWidth='1.6'
                strokeOpacity='0.85'
                filter='url(#ft-pulse-glow)'
              />
              <ellipse
                cx='412'
                cy='252'
                rx='17'
                ry='7.2'
                fill='none'
                stroke='#F59E0B'
                strokeWidth='0.8'
                strokeOpacity='0.5'
              />
              <ellipse
                cx='412'
                cy='252'
                rx='9'
                ry='3.8'
                fill='none'
                stroke='#FDE047'
                strokeWidth='0.8'
                strokeOpacity='0.75'
              />

              {/* Cable Input Socket on Left Rim */}
              <g id='terminal-cable-socket'>
                <ellipse
                  cx='370'
                  cy='256'
                  rx='2.8'
                  ry='4.5'
                  fill='#334155'
                  stroke='#94A3B8'
                  strokeWidth='0.8'
                />
                <circle
                  cx='370'
                  cy='256'
                  r='1.8'
                  fill='#F97316'
                  filter='url(#ft-pulse-glow)'
                />
              </g>

              {/* Floating Gold Coin with Dynamic Shadow */}
              <g className='ft-coin-anim'>
                <ellipse
                  cx='412'
                  cy='252'
                  rx='16'
                  ry='7'
                  fill='#000000'
                  opacity='0.35'
                  filter='url(#ft-shadow-blur)'
                />
                <path
                  d='M 400 206 C 400 215, 405 222, 413 222 C 421 222, 426 215, 426 206 L 426 212 C 426 221, 421 228, 413 228 C 405 228, 400 221, 400 212 Z'
                  fill='url(#ft-coin-rim)'
                />
                <ellipse
                  cx='413'
                  cy='206'
                  rx='13.5'
                  ry='9'
                  fill='url(#ft-coin-face)'
                  filter='url(#ft-gold-glow)'
                />
                <ellipse
                  cx='413'
                  cy='206'
                  rx='9.5'
                  ry='6.2'
                  fill='none'
                  stroke='#FEF08A'
                  strokeWidth='1.1'
                  strokeOpacity='0.9'
                />
                <path
                  d='M 413 201 L 414.5 205 L 418 206 L 414.5 207 L 413 211 L 411.5 207 L 408 206 L 411.5 205 Z'
                  fill='#FFFFFF'
                />
              </g>
            </g>
          </g>

          {/* ========================================================= */}
          {/* 2. THE 4 DYNAMIC CARDS WITH ENTRY/EXIT LIFECYCLE         */}
          {/* ========================================================= */}
          <AnimatePresence>
            {isLoading && (
              <>
                {/* CARD 2: 3D GROWTH TREND CHART CARD (UPPER RIGHT) */}
                <motion.g
                  key='card2'
                  variants={card2Variants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                >
                  <g className='ft-card-2' id='card-trend-layer'>
                    <path
                      d='M 256 138 L 305 108 L 305 178 L 256 208 Z'
                      fill='#051329'
                      opacity='0.22'
                      transform='translate(8, 16)'
                      filter='url(#ft-shadow-blur)'
                    />
                    <path
                      d='M 256 198 L 263 203 L 312 173 L 305 168 Z'
                      fill={palette.c2Edge}
                    />
                    <path
                      d='M 305 108 L 312 113 L 312 173 L 305 168 Z'
                      fill={palette.c2Edge}
                      opacity='0.85'
                    />
                    <path
                      d='M 256 136 C 256 131, 260 126, 266 123 L 298 103 C 303 100, 308 103, 308 108 L 308 174 C 308 179, 304 184, 298 187 L 266 207 C 261 210, 256 207, 256 202 Z'
                      fill='url(#ft-c2-face)'
                      filter='url(#ft-card-shadow)'
                    />
                    <path
                      d='M 257 137 L 297 105 C 301 103, 306 105, 306 109 L 306 172 L 268 196 C 264 198, 258 196, 258 192 Z'
                      fill='none'
                      stroke='url(#ft-c1-bevel-light)'
                      strokeWidth='1.4'
                    />
                    <path
                      d='M 264 178 L 273 162 L 282 168 L 298 136 L 298 174 L 264 196 Z'
                      fill='url(#ft-c2-chart-area)'
                    />
                    <path
                      d='M 264 178 L 273 162 L 282 168 L 298 136'
                      fill='none'
                      stroke='#FFFFFF'
                      strokeWidth='3.2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='ft-trend-anim'
                    />
                    <circle
                      cx='298'
                      cy='136'
                      r='4'
                      fill='#FFFFFF'
                      filter='url(#ft-pulse-glow)'
                    />
                    <circle cx='298' cy='136' r='2' fill={palette.glow} />
                    <g transform='translate(267, 137) skewY(-28) scale(0.7)'>
                      <rect
                        x='-2'
                        y='-9'
                        width='26'
                        height='12'
                        rx='4'
                        fill='#FFFFFF'
                        fillOpacity='0.25'
                      />
                      <path
                        d='M 1 0 L 4 -4 L 7 0'
                        stroke='#FFFFFF'
                        strokeWidth='1.8'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <text
                        x='9'
                        y='-1'
                        fill='#FFFFFF'
                        fontSize='7'
                        fontWeight='700'
                        fontFamily='monospace'
                      >
                        UP
                      </text>
                    </g>
                  </g>
                </motion.g>

                {/* CARD 1: 3D ACRYLIC CURRENCY SLAB (FRONT LEFT) */}
                <motion.g
                  key='card1'
                  variants={card1Variants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                >
                  <g className='ft-card-1' id='card-currency-layer'>
                    <path
                      d='M 152 168 L 214 133 L 214 245 L 152 280 Z'
                      fill='#051329'
                      opacity='0.28'
                      transform='translate(8, 16)'
                      filter='url(#ft-shadow-blur)'
                    />
                    <path
                      d='M 212 133 L 219 137 L 219 243 L 212 239 Z'
                      fill={palette.c1Edge}
                    />
                    <path
                      d='M 154 269 L 161 273 L 219 243 L 212 239 Z'
                      fill={palette.c1Edge}
                      opacity='0.9'
                    />
                    <path
                      d='M 152 165 C 152 158, 157 151, 164 147 L 204 124 C 210 120, 216 124, 216 131 L 216 238 C 216 245, 211 252, 204 256 L 164 279 C 157 283, 152 279, 152 272 Z'
                      fill='url(#ft-c1-face)'
                      filter='url(#ft-card-shadow)'
                    />
                    <path
                      d='M 154 166 L 204 126 C 209 123, 214 126, 214 131 L 214 236 L 164 276 C 159 278, 154 275, 154 270 Z'
                      fill='none'
                      stroke='url(#ft-c1-bevel-light)'
                      strokeWidth='1.6'
                    />
                    <g
                      transform='translate(170, 162) skewY(-28) scale(0.65)'
                      opacity='0.7'
                    >
                      <path
                        d='M 0 6 A 6 6 0 0 1 0 -6'
                        fill='none'
                        stroke='#FFFFFF'
                        strokeWidth='1.8'
                        strokeLinecap='round'
                      />
                      <path
                        d='M 4 9 A 10 10 0 0 1 4 -9'
                        fill='none'
                        stroke='#FFFFFF'
                        strokeWidth='1.8'
                        strokeLinecap='round'
                      />
                      <path
                        d='M 8 12 A 14 14 0 0 1 8 -12'
                        fill='none'
                        stroke='#FFFFFF'
                        strokeWidth='1.8'
                        strokeLinecap='round'
                      />
                    </g>
                    <g transform='translate(184, 208) skewY(-28) scale(1.05, 1.25)'>
                      <text
                        x='0'
                        y='3'
                        textAnchor='middle'
                        dominantBaseline='central'
                        fill='#78350F'
                        opacity='0.45'
                        fontSize='40'
                        fontWeight='900'
                        fontFamily='system-ui, -apple-system, sans-serif'
                      >
                        {currency}
                      </text>
                      <text
                        x='0'
                        y='0'
                        textAnchor='middle'
                        dominantBaseline='central'
                        fill='#FFFFFF'
                        fontSize='40'
                        fontWeight='900'
                        fontFamily='system-ui, -apple-system, sans-serif'
                        className='drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
                      >
                        {currency}
                      </text>
                    </g>
                    <g transform='translate(162, 238) skewY(-28) scale(0.65)'>
                      <rect
                        x='0'
                        y='0'
                        width='16'
                        height='12'
                        rx='2.5'
                        fill='#FDE047'
                        stroke='#CA8A04'
                        strokeWidth='0.8'
                      />
                      <line
                        x1='0'
                        y1='6'
                        x2='16'
                        y2='6'
                        stroke='#CA8A04'
                        strokeWidth='0.6'
                      />
                      <line
                        x1='8'
                        y1='0'
                        x2='8'
                        y2='12'
                        stroke='#CA8A04'
                        strokeWidth='0.6'
                      />
                    </g>
                  </g>
                </motion.g>

                {/* CARD 3: 3D METRIC BAR CHART SLAB (BOTTOM FRONT) */}
                <motion.g
                  key='card3'
                  variants={card3Variants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                >
                  <g className='ft-card-3' id='card-bars-layer'>
                    <path
                      d='M 182 268 L 240 234 L 240 324 L 182 358 Z'
                      fill='#051329'
                      opacity='0.22'
                      transform='translate(6, 12)'
                      filter='url(#ft-shadow-blur)'
                    />
                    <path
                      d='M 235 236 L 241 240 L 241 326 L 235 322 Z'
                      fill={palette.c2Edge}
                    />
                    <path
                      d='M 183 348 L 189 352 L 241 326 L 235 322 Z'
                      fill={palette.c2Edge}
                      opacity='0.85'
                    />
                    <path
                      d='M 180 262 C 180 256, 185 251, 191 247 L 229 225 C 235 221, 240 225, 240 231 L 240 316 C 240 322, 235 328, 229 332 L 191 354 C 185 358, 180 354, 180 348 Z'
                      fill='url(#ft-c3-face)'
                      filter='url(#ft-card-shadow)'
                    />
                    <path
                      d='M 182 264 L 229 227 C 233 224, 238 227, 238 232 L 238 314 L 191 350 C 187 352, 182 350, 182 345 Z'
                      fill='none'
                      stroke='url(#ft-c1-bevel-light)'
                      strokeWidth='1.3'
                    />
                    <g transform='translate(189, 256) skewY(-28)'>
                      <line
                        x1='2'
                        y1='64'
                        x2='46'
                        y2='64'
                        stroke='#FFFFFF'
                        strokeOpacity='0.35'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                      />
                      <rect
                        x='4'
                        width='7'
                        rx='3.5'
                        fill='url(#ft-bar-gradient)'
                        className='ft-bar-anim-1'
                        filter='url(#ft-card-shadow)'
                      />
                      <rect
                        x='15'
                        width='7'
                        rx='3.5'
                        fill='url(#ft-bar-gradient)'
                        className='ft-bar-anim-2'
                        filter='url(#ft-card-shadow)'
                      />
                      <rect
                        x='26'
                        width='7'
                        rx='3.5'
                        fill='url(#ft-bar-gradient)'
                        className='ft-bar-anim-3'
                        filter='url(#ft-card-shadow)'
                      />
                      <rect
                        x='37'
                        width='7'
                        rx='3.5'
                        fill='url(#ft-bar-gradient)'
                        className='ft-bar-anim-4'
                        filter='url(#ft-card-shadow)'
                      />
                    </g>
                  </g>
                </motion.g>

                {/* CARD 4: 3D ASSET / YIELD TILE (RIGHT FOREGROUND) */}
                <motion.g
                  key='card4'
                  variants={card4Variants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                >
                  <g className='ft-card-4' id='card-secondary-layer'>
                    <path
                      d='M 242 248 L 290 220 L 290 298 L 242 326 Z'
                      fill='#051329'
                      opacity='0.2'
                      transform='translate(6, 12)'
                      filter='url(#ft-shadow-blur)'
                    />
                    <path
                      d='M 284 222 L 290 226 L 290 300 L 284 296 Z'
                      fill={palette.c1Edge}
                    />
                    <path
                      d='M 243 318 L 249 322 L 290 300 L 284 296 Z'
                      fill={palette.c1Edge}
                      opacity='0.85'
                    />
                    <path
                      d='M 242 242 C 242 237, 246 233, 251 230 L 280 213 C 285 210, 289 213, 289 218 L 289 292 C 289 297, 285 301, 280 304 L 251 321 C 246 324, 242 320, 242 315 Z'
                      fill='url(#ft-c4-face)'
                      filter='url(#ft-card-shadow)'
                    />
                    <path
                      d='M 244 244 L 279 215 C 283 213, 287 215, 287 219 L 287 290 L 252 317 C 248 319, 244 317, 244 313 Z'
                      fill='none'
                      stroke='url(#ft-c1-bevel-light)'
                      strokeWidth='1.3'
                    />
                    <g transform='translate(265, 268) skewY(-28)'>
                      <circle
                        cx='0'
                        cy='-4'
                        r='12'
                        fill='#FFFFFF'
                        fillOpacity='0.22'
                      />
                      <text
                        x='0'
                        y='-1'
                        textAnchor='middle'
                        dominantBaseline='central'
                        fill='#FFFFFF'
                        fontSize='18'
                        fontWeight='900'
                        fontFamily='system-ui, -apple-system, sans-serif'
                        className='drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]'
                      >
                        {currency}
                      </text>
                      <rect
                        x='-14'
                        y='12'
                        width='28'
                        height='9'
                        rx='4.5'
                        fill='#78350F'
                        fillOpacity='0.5'
                      />
                      <text
                        x='0'
                        y='17'
                        textAnchor='middle'
                        dominantBaseline='central'
                        fill='#FDE047'
                        fontSize='6.5'
                        fontWeight='800'
                        fontFamily='monospace'
                      >
                        LIVE
                      </text>
                    </g>
                  </g>
                </motion.g>
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* Typography & Status Indicator (Matches @/components/ui/auth Design System) */}
      {showText && (
        <div className='mt-5 flex flex-col items-center text-center space-y-2 min-h-[70px] select-none'>
          <AnimatePresence mode='wait'>
            {isLoading ? (
              <motion.div
                key='text-loading'
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                className='flex flex-col items-center'
              >
                {/* Security status pill */}
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium mb-1 backdrop-blur-sm shadow-sm'>
                  <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75' />
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-amber-500' />
                  </span>
                  <span>Securing Ledger Session</span>
                </div>

                {/* Primary Auth Heading */}
                <h3 className='font-display text-lg sm:text-xl font-extrabold tracking-tight text-foreground'>
                  {title.includes(' ') ? (
                    <>
                      {title.substring(0, title.lastIndexOf(' '))}{' '}
                      <span className='font-display font-extrabold text-amber-500 dark:text-amber-400'>
                        {title.substring(title.lastIndexOf(' ') + 1)}
                      </span>
                    </>
                  ) : (
                    title
                  )}
                </h3>

                {subtitle && (
                  <p className='text-xs sm:text-sm text-muted-foreground font-normal tracking-normal max-w-[280px] leading-relaxed mt-0.5'>
                    {subtitle}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key='text-complete'
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex flex-col items-center'
              >
                {/* Success pill */}
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium mb-1 backdrop-blur-sm shadow-sm'>
                  <span className='size-1.5 rounded-full bg-emerald-500' />
                  <span>Security Verified</span>
                </div>

                {/* Success Heading */}
                <h3 className='font-display text-lg sm:text-xl font-extrabold tracking-tight text-foreground'>
                  {completeTitle.includes(' ') ? (
                    <>
                      {completeTitle.substring(
                        0,
                        completeTitle.lastIndexOf(' ')
                      )}{' '}
                      <span className='font-display font-extrabold text-emerald-500 dark:text-emerald-400'>
                        {completeTitle.substring(
                          completeTitle.lastIndexOf(' ') + 1
                        )}
                      </span>
                    </>
                  ) : (
                    completeTitle
                  )}
                </h3>

                {completeSubtitle && (
                  <p className='text-xs sm:text-sm text-muted-foreground font-normal tracking-normal max-w-[280px] leading-relaxed mt-0.5'>
                    {completeSubtitle}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300'>
        <div className='p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/90 shadow-2xl flex flex-col items-center'>
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export default FintechLoader;
