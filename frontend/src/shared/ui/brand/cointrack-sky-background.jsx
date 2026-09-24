'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export function CoinTrackSkyBackground() {
  const { scrollYProgress } = useScroll();

  // Parallax effect: The sky moves slightly up as you scroll down.
  // We use a small percentage so the scaled up background covers the gap.
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-5%']);
  // Scale it up enough initially so that when it translates up, the bottom edge doesn't show
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1.15]);

  return (
    <>
      {/* Pinned cloudy sky background layer for Cirrus UI ambiance with scroll parallax */}
      <motion.div
        aria-hidden
        className='fixed inset-0 pointer-events-none z-0 dark:brightness-[0.35] dark:saturate-50 transition-all duration-700'
        style={{
          backgroundImage: "url('/sky.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          y,
          scale,
        }}
      />

      {/* Soft warm ambient sun glow (cool moonlight in dark mode) */}
      <div
        aria-hidden
        className='fixed -top-40 right-0 w-[600px] h-[600px] bg-amber-100/30 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none z-0 transition-colors duration-700'
      />
    </>
  );
}
