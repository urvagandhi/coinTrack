'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Compass, LogIn, ChevronDown } from 'lucide-react';
import { CoinTrackNavbar } from '@/components/ui/coinTrack/cointrack-navbar';
import { CoinTrackFooter } from '@/components/ui/coinTrack/cointrack-footer';
import { CoinTrackSkyBackground } from '@/components/ui/coinTrack/cointrack-sky-background';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpotlightInput } from '@/components/ui/primitives/spotlight-input';

const SEARCH_SUGGESTIONS = [
  {
    id: 'home',
    label: 'Back to Home',
    category: 'Navigation',
    Icon: ArrowLeft,
    href: '/',
  },
  {
    id: 'dashboard',
    label: 'Open Dashboard',
    category: 'App',
    Icon: Compass,
    href: '/dashboard',
  },
  {
    id: 'login',
    label: 'Sign In',
    category: 'Auth',
    Icon: LogIn,
    href: '/login',
  },
];

export function NotFoundPage() {
  const footerRef = useRef(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mouse tilt tracking for interactive character & eyes
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 140 };
  const eyeX = useSpring(
    useTransform(mouseX, [-350, 350], [-10, 10]),
    springConfig
  );
  const eyeY = useSpring(
    useTransform(mouseY, [-350, 350], [-8, 8]),
    springConfig
  );
  const headRotate = useSpring(
    useTransform(mouseX, [-350, 350], [-12, 12]),
    springConfig
  );

  const handleMouseMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className='min-h-screen w-full bg-[#e8f1fb] text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans relative overflow-x-hidden flex flex-col'
    >
      {/* ─────────────────────────────────────────────────────────────
          PINNED CLOUDY SKY BACKGROUND LAYER (LANDING PAGE STYLE)
          ───────────────────────────────────────────────────────────── */}
      <CoinTrackSkyBackground />

      {/* Hero Section taking full viewport height */}
      <div className='min-h-screen flex flex-col relative z-10'>
        {/* ── FLOATING NAVBAR ── */}
        <CoinTrackNavbar />

        {/* ── MAIN 404 HERO CONTENT ── */}
        <main className='flex-1 flex flex-col items-center justify-center text-center px-4 pt-16 pb-24 sm:pt-20 sm:pb-32'>
          {/* Big 404 Display with PERFECT HARMONIC SPACING */}
          <div className='relative flex items-center justify-center gap-1 sm:gap-2.5 md:gap-3.5 lg:gap-4 tracking-tighter font-extrabold select-none'>
            {/* Shared SVG Filters for Fluffy Fur Texture */}
            <svg
              className='absolute width-0 height-0 overflow-hidden'
              aria-hidden='true'
            >
              <defs>
                <filter
                  id='fluffyFurFour'
                  x='-30%'
                  y='-30%'
                  width='160%'
                  height='160%'
                >
                  <feTurbulence
                    type='fractalNoise'
                    baseFrequency='0.045'
                    numOctaves='4'
                    result='noise'
                  />
                  <feDisplacementMap
                    in='SourceGraphic'
                    in2='noise'
                    scale='8'
                    xChannelSelector='R'
                    yChannelSelector='G'
                  />
                </filter>

                <radialGradient id='fluffyGradient3D' cx='35%' cy='30%' r='70%'>
                  <stop offset='0%' stopColor='#60a5fa' />
                  <stop offset='45%' stopColor='#2563eb' />
                  <stop offset='85%' stopColor='#1d4ed8' />
                  <stop offset='100%' stopColor='#1e3a8a' />
                </radialGradient>

                <linearGradient
                  id='furHighlight'
                  x1='0%'
                  y1='0%'
                  x2='40%'
                  y2='100%'
                >
                  <stop offset='0%' stopColor='#ffffff' stopOpacity='0.6' />
                  <stop offset='100%' stopColor='#ffffff' stopOpacity='0' />
                </linearGradient>
              </defs>
            </svg>

            {/* LEFT FLUFFY HAIRY '4' */}
            <div className='relative w-[110px] h-[150px] sm:w-[170px] sm:h-[220px] md:w-[210px] md:h-[270px] lg:w-[240px] lg:h-[310px] flex items-center justify-center drop-shadow-[0_15px_30px_rgba(37,99,235,0.35)]'>
              <svg
                viewBox='0 0 200 260'
                className='w-full h-full overflow-visible'
              >
                <path
                  d='M 130 20 
                   L 30 150 
                   C 25 158, 25 170, 35 170 
                   L 130 170 
                   L 130 225 
                   C 130 235, 140 245, 150 245 
                   C 160 245, 170 235, 170 225 
                   L 170 170 
                   L 190 170 
                   C 200 170, 205 160, 205 150 
                   C 205 140, 200 135, 190 135 
                   L 170 135 
                   L 170 30 
                   C 170 20, 160 10, 150 10 
                   C 140 10, 130 20, 130 20 Z 
                   M 130 75 
                   L 130 135 
                   L 75 135 Z'
                  fill='url(#fluffyGradient3D)'
                  filter='url(#fluffyFurFour)'
                  stroke='#1d4ed8'
                  strokeWidth='5'
                  strokeLinejoin='round'
                  strokeLinecap='round'
                />
                <path
                  d='M 130 20 L 30 150 L 130 170 Z'
                  fill='url(#furHighlight)'
                  opacity='0.65'
                />
              </svg>
            </div>

            {/* MIDDLE 3D MASCOT CHARACTER */}
            <motion.div
              style={{ rotate: headRotate }}
              className='relative w-[110px] h-[150px] sm:w-[170px] sm:h-[220px] md:w-[210px] md:h-[270px] lg:w-[240px] lg:h-[310px] flex items-center justify-center z-10'
            >
              {/* Ambient Shadow under Mascot */}
              <div className='absolute bottom-2 inset-x-4 h-7 bg-blue-950/30 blur-xl rounded-full' />

              <svg
                viewBox='0 0 300 300'
                className='w-full h-full drop-shadow-2xl overflow-visible'
              >
                {/* Animated Fluffy Tail */}
                <motion.path
                  animate={{ rotate: [-6, 10, -6] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  d='M 60 215 Q 15 180 25 125 Q 50 100 75 135 Q 55 190 80 225 Z'
                  fill='url(#fluffyGradient3D)'
                  filter='url(#fluffyFurFour)'
                />

                {/* Main 3D Fluffy Body */}
                <path
                  d='M 150 35 
                   C 225 35, 255 75, 255 155 
                   C 255 230, 225 265, 150 265 
                   C 75 265, 45 230, 45 155 
                   C 45 75, 75 35, 150 35 Z'
                  fill='url(#fluffyGradient3D)'
                  filter='url(#fluffyFurFour)'
                />

                {/* 3D Specular Highlight Overlay */}
                <ellipse
                  cx='120'
                  cy='75'
                  rx='65'
                  ry='35'
                  fill='url(#furHighlight)'
                  transform='rotate(-20 120 75)'
                />

                {/* Feet */}
                <ellipse cx='102' cy='258' rx='26' ry='14' fill='#1e3a8a' />
                <ellipse cx='198' cy='258' rx='26' ry='14' fill='#1e3a8a' />

                {/* Interactive Eyes */}
                <g transform='translate(150, 125)'>
                  <ellipse cx='-36' cy='0' rx='25' ry='29' fill='#ffffff' />
                  <ellipse
                    cx='-36'
                    cy='0'
                    rx='25'
                    ry='29'
                    stroke='#cbd5e1'
                    strokeWidth='2'
                    fill='none'
                  />

                  <ellipse cx='36' cy='0' rx='25' ry='29' fill='#ffffff' />
                  <ellipse
                    cx='36'
                    cy='0'
                    rx='25'
                    ry='29'
                    stroke='#cbd5e1'
                    strokeWidth='2'
                    fill='none'
                  />

                  {/* Left Pupil */}
                  <motion.g style={{ x: eyeX, y: eyeY }}>
                    <circle cx='-36' cy='2' r='13' fill='#0f172a' />
                    <circle cx='-32' cy='-4' r='5' fill='#ffffff' />
                    <circle cx='-40' cy='6' r='2.5' fill='#ffffff' />
                  </motion.g>

                  {/* Right Pupil */}
                  <motion.g style={{ x: eyeX, y: eyeY }}>
                    <circle cx='36' cy='2' r='13' fill='#0f172a' />
                    <circle cx='40' cy='-4' r='5' fill='#ffffff' />
                    <circle cx='32' cy='6' r='2.5' fill='#ffffff' />
                  </motion.g>

                  {/* Eyebrows */}
                  <path
                    d='M -54 -36 Q -36 -48 -18 -34'
                    stroke='#1e3a8a'
                    strokeWidth='5.5'
                    strokeLinecap='round'
                    fill='none'
                  />
                  <path
                    d='M 18 -34 Q 36 -48 54 -36'
                    stroke='#1e3a8a'
                    strokeWidth='5.5'
                    strokeLinecap='round'
                    fill='none'
                  />
                </g>

                {/* Mouth */}
                <ellipse cx='150' cy='176' rx='14' ry='10' fill='#0f172a' />

                {/* Left Arm Scratching Head */}
                <motion.g
                  animate={{ rotate: [-4, 6, -4] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '100px 170px' }}
                >
                  <path
                    d='M 90 165 Q 45 115 72 65 Q 96 55 112 72 Q 90 102 108 155 Z'
                    fill='url(#fluffyGradient3D)'
                    filter='url(#fluffyFurFour)'
                  />
                  <circle cx='88' cy='64' r='14' fill='#2563eb' />
                </motion.g>

                {/* Right Arm */}
                <path
                  d='M 210 165 Q 242 175 234 200 Q 212 210 200 182 Z'
                  fill='url(#fluffyGradient3D)'
                  filter='url(#fluffyFurFour)'
                />
              </svg>
            </motion.div>

            {/* RIGHT FLUFFY HAIRY '4' (BALANCED SUBTLE OFFSET) */}
            <div className='relative w-[110px] h-[150px] sm:w-[170px] sm:h-[220px] md:w-[210px] md:h-[270px] lg:w-[240px] lg:h-[310px] flex items-center justify-center drop-shadow-[0_15px_30px_rgba(37,99,235,0.35)] -ml-1 sm:-ml-2 md:-ml-3 lg:-ml-4'>
              <svg
                viewBox='0 0 200 260'
                className='w-full h-full overflow-visible'
              >
                <path
                  d='M 130 20 
                   L 30 150 
                   C 25 158, 25 170, 35 170 
                   L 130 170 
                   L 130 225 
                   C 130 235, 140 245, 150 245 
                   C 160 245, 170 235, 170 225 
                   L 170 170 
                   L 190 170 
                   C 200 170, 205 160, 205 150 
                   C 205 140, 200 135, 190 135 
                   L 170 135 
                   L 170 30 
                   C 170 20, 160 10, 150 10 
                   C 140 10, 130 20, 130 20 Z 
                   M 130 75 
                   L 130 135 
                   L 75 135 Z'
                  fill='url(#fluffyGradient3D)'
                  filter='url(#fluffyFurFour)'
                  stroke='#1d4ed8'
                  strokeWidth='5'
                  strokeLinejoin='round'
                  strokeLinecap='round'
                />
                <path
                  d='M 130 20 L 30 150 L 130 170 Z'
                  fill='url(#furHighlight)'
                  opacity='0.65'
                />
              </svg>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className='mt-4 sm:mt-6 space-y-2 max-w-2xl mx-auto relative z-20'>
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-950 tracking-tight leading-tight'>
              Sorry, that page cannot be found
            </h1>
            <p className='text-neutral-600 font-medium text-base sm:text-xl'>
              Let&apos;s get you back to somewhere familiar
            </p>
          </div>

          <div className='mt-8 max-w-md w-full mx-auto text-left relative z-40'>
            <SpotlightInput
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onSelect={item => {
                if (item.href) {
                  router.push(item.href);
                }
              }}
              placeholder='Search pages, features, or actions...'
              quickJumpItems={SEARCH_SUGGESTIONS}
              quickJumpHeading='Suggested Destinations'
            />
          </div>

          {/* Action Button */}
          <div className='mt-8 flex flex-wrap items-center justify-center gap-3 relative z-30'>
            <Link
              href='/'
              className='inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-base shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.25)] transition-all transform hover:-translate-y-0.5 active:translate-y-0'
            >
              <ArrowLeft className='w-5 h-5 text-white/90' />
              <span>Go to Home</span>
            </Link>
          </div>
        </main>

        {/* Scroll Down Button */}
        <div
          className='absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce cursor-pointer'
          onClick={scrollToFooter}
        >
          <span className='text-[10px] uppercase tracking-widest text-neutral-600 font-semibold'>
            Scroll
          </span>
          <ChevronDown className='size-5 text-neutral-600' />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div ref={footerRef} className='w-full relative z-10 bg-white'>
        <CoinTrackFooter />
      </div>
    </div>
  );
}

export default NotFoundPage;
