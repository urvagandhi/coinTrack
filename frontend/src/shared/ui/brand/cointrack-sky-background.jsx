'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * CoinTrackSkyBackground
 *
 * An award-winning, interactive atmospheric background combining:
 * 1. The iconic photorealistic Cirrus sky foundation (/sky.jpg) with scroll parallax.
 * 2. Real volumetric cloud clusters that drift naturally and part/repel around the cursor.
 * 3. Interactive celestial/solar dust particles that twinkle, float on air currents, and scatter on mouse hover.
 * 4. A dynamic celestial spotlight (warm solar flare in light mode / cosmic aurora glow in dark mode)
 *    that smoothly tracks the mouse with physics-based inertia (lerp).
 * 5. Tactile click/tap atmospheric shockwave ripples that disperse particles in expanding rings.
 *
 * Fully responsive, dark-mode adaptive, accessible (prefers-reduced-motion safe),
 * and optimized for 60-120 FPS via direct Canvas 2D and un-reflowed transforms.
 */
export function CoinTrackSkyBackground({
  interactive = true,
  showParticles = true,
  showClouds = true,
  showSpotlight = true,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const spotlightRef = useRef(null);

  // Framer Motion scroll parallax for the base sky photo
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-5%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.15]);

  useEffect(() => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Detect user accessibility preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse & physics tracking (using refs/primitives to avoid React re-renders)
    const mouse = {
      x: width * 0.75,
      y: height * 0.25,
      targetX: width * 0.75,
      targetY: height * 0.25,
      vx: 0,
      vy: 0,
      lastX: width * 0.75,
      lastY: height * 0.25,
      isActive: false,
      hasMoved: false,
    };

    // Expanding click ripples
    const ripples = [];

    // Resize handling with DPR clamping
    function handleResize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initClouds();
      initParticles();
    }

    // ─────────────────────────────────────────────────────────────
    // 1. VOLUMETRIC CLOUDS SYSTEM
    // ─────────────────────────────────────────────────────────────
    let clouds = [];

    function initClouds() {
      if (!showClouds) return;
      clouds = [];
      const isMobile = width < 768;
      const cloudCount = isMobile ? 6 : 11;

      for (let i = 0; i < cloudCount; i++) {
        const cloudWidth = 260 + Math.random() * 320;
        const puffCount = 7 + Math.floor(Math.random() * 6);
        const puffs = [];

        for (let p = 0; p < puffCount; p++) {
          puffs.push({
            offsetX: (Math.random() - 0.5) * cloudWidth * 0.75,
            offsetY: (Math.random() - 0.5) * 55,
            radius: 50 + Math.random() * 70,
            alpha: 0.05 + Math.random() * 0.08,
          });
        }

        clouds.push({
          x: Math.random() * width,
          y: 40 + Math.random() * (height * 0.58),
          baseY: 40 + Math.random() * (height * 0.58),
          vx: 0.12 + Math.random() * 0.22, // Drift velocity
          pushVx: 0,
          pushVy: 0,
          width: cloudWidth,
          puffs,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. CELESTIAL / SOLAR DUST PARTICLES SYSTEM
    // ─────────────────────────────────────────────────────────────
    let particles = [];

    function initParticles() {
      if (!showParticles) return;
      particles = [];
      const isMobile = width < 768;
      const count = isMobile ? 28 : 55;

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          baseVx: (Math.random() - 0.5) * 0.35,
          baseVy: -0.2 - Math.random() * 0.45, // Gentle natural upward float
          vx: (Math.random() - 0.5) * 0.35,
          vy: -0.2 - Math.random() * 0.45,
          radius: 1.2 + Math.random() * 2.2,
          baseAlpha: 0.25 + Math.random() * 0.55,
          pulseSpeed: 0.015 + Math.random() * 0.03,
          pulsePhase: Math.random() * Math.PI * 2,
          isGold: Math.random() > 0.4, // Golden sunlit specks vs diamond white
        });
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse & Touch interaction listeners
    function onMouseMove(e) {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isActive = true;
      mouse.hasMoved = true;
    }

    function onMouseLeave() {
      mouse.isActive = false;
    }

    function onTouchMove(e) {
      if (e.touches && e.touches[0]) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.isActive = true;
        mouse.hasMoved = true;
      }
    }

    function onTouchEnd() {
      mouse.isActive = false;
    }

    function onClick(e) {
      if (ripples.length < 5) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 10,
          maxRadius: 180 + Math.random() * 60,
          alpha: 0.5,
        });
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('click', onClick, { passive: true });

    // ─────────────────────────────────────────────────────────────
    // 3. MAIN 60/120 FPS ANIMATION LOOP
    // ─────────────────────────────────────────────────────────────
    let lastTime = performance.now();

    function render(currentTime) {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Check dark mode state dynamically for seamless live theme switching
      const isDark = document.documentElement.classList.contains('dark');

      // Mouse inertia: smooth lerp toward target
      const lerpSpeed = prefersReducedMotion ? 0.02 : 0.06;
      mouse.x += (mouse.targetX - mouse.x) * lerpSpeed;
      mouse.y += (mouse.targetY - mouse.y) * lerpSpeed;

      // Mouse velocity for wake effects
      mouse.vx = (mouse.x - mouse.lastX) * 0.4;
      mouse.vy = (mouse.y - mouse.lastY) * 0.4;
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;

      // Update interactive dynamic spotlight DOM position without React state
      if (showSpotlight && spotlightRef.current) {
        const spotX = Math.round(mouse.x);
        const spotY = Math.round(mouse.y);
        spotlightRef.current.style.transform = `translate3d(${spotX}px, ${spotY}px, 0)`;
        spotlightRef.current.style.opacity = mouse.hasMoved ? '1' : '0.7';
      }

      // Clear previous canvas frame
      ctx.clearRect(0, 0, width, height);

      // ─────────────────────────────────────────────────────────
      // A. DRAW VOLUMETRIC DRIFTING CLOUDS
      // ─────────────────────────────────────────────────────────
      if (showClouds && clouds.length > 0) {
        for (let i = 0; i < clouds.length; i++) {
          const c = clouds[i];

          // Natural slow wind drift
          if (!prefersReducedMotion) {
            c.x += c.vx;

            // Interactive wind wake: repel cloud puffs gently if cursor sweeps near
            if (mouse.isActive) {
              const dx = c.x - mouse.x;
              const dy = c.y - mouse.y;
              const dist = Math.hypot(dx, dy);
              const repelRadius = 240;

              if (dist < repelRadius && dist > 0) {
                const force = (repelRadius - dist) / repelRadius;
                c.pushVx += (dx / dist) * force * 1.5;
                c.pushVy += (dy / dist) * force * 1.5;
              }
            }

            // Spring return & damping
            c.pushVx *= 0.94;
            c.pushVy *= 0.94;
            c.x += c.pushVx;
            c.y += c.pushVy;

            // Gentle restorative force toward baseline Y
            c.y += (c.baseY - c.y) * 0.02;

            // Wrap around right edge seamlessly
            if (c.x - c.width > width) {
              c.x = -c.width;
              c.y = 40 + Math.random() * (height * 0.58);
              c.baseY = c.y;
            }
          }

          // Draw the fluffy cloud puffs
          for (let p = 0; p < c.puffs.length; p++) {
            const puff = c.puffs[p];
            const px = c.x + puff.offsetX;
            const py = c.y + puff.offsetY;

            // Don't draw if completely off-screen
            if (px + puff.radius < 0 || px - puff.radius > width) continue;

            const grad = ctx.createRadialGradient(
              px,
              py,
              0,
              px,
              py,
              puff.radius
            );

            if (isDark) {
              // Moonlight cloud tones
              grad.addColorStop(0, `rgba(180, 200, 240, ${puff.alpha * 0.4})`);
              grad.addColorStop(
                0.5,
                `rgba(130, 160, 210, ${puff.alpha * 0.2})`
              );
              grad.addColorStop(1, 'rgba(7, 9, 13, 0)');
            } else {
              // Sunlight cirrus white/sky-tinted puffs
              grad.addColorStop(0, `rgba(255, 255, 255, ${puff.alpha * 1.4})`);
              grad.addColorStop(
                0.55,
                `rgba(240, 246, 255, ${puff.alpha * 0.8})`
              );
              grad.addColorStop(1, 'rgba(232, 241, 251, 0)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, puff.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ─────────────────────────────────────────────────────────
      // B. DRAW INTERACTIVE CLICK RIPPLES
      // ─────────────────────────────────────────────────────────
      if (ripples.length > 0) {
        for (let r = ripples.length - 1; r >= 0; r--) {
          const rip = ripples[r];
          rip.radius += 110 * delta;
          rip.alpha *= 0.94;

          ctx.save();
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle = isDark
            ? `rgba(165, 180, 252, ${rip.alpha * 0.6})`
            : `rgba(253, 230, 138, ${rip.alpha * 0.7})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Push particles on shockwave hit
          for (let p = 0; p < particles.length; p++) {
            const part = particles[p];
            const dx = part.x - rip.x;
            const dy = part.y - rip.y;
            const dist = Math.hypot(dx, dy);
            if (Math.abs(dist - rip.radius) < 25 && dist > 0) {
              const impulse = rip.alpha * 3.5;
              part.vx += (dx / dist) * impulse;
              part.vy += (dy / dist) * impulse;
            }
          }

          if (rip.alpha < 0.01 || rip.radius > rip.maxRadius) {
            ripples.splice(r, 1);
          }
        }
      }

      // ─────────────────────────────────────────────────────────
      // C. DRAW CELESTIAL / SOLAR PARTICLES
      // ─────────────────────────────────────────────────────────
      if (showParticles && particles.length > 0) {
        const timeSec = currentTime * 0.001;

        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];

          if (!prefersReducedMotion) {
            // Ambient air current drift
            pt.x += pt.vx;
            pt.y += pt.vy;

            // Damping back to baseline drift velocity
            pt.vx += (pt.baseVx - pt.vx) * 0.04;
            pt.vy += (pt.baseVy - pt.vy) * 0.04;

            // Cursor Repulsion & Wake
            if (mouse.isActive) {
              const dx = pt.x - mouse.x;
              const dy = pt.y - mouse.y;
              const dist = Math.hypot(dx, dy);
              const repelRadius = 135;

              if (dist < repelRadius && dist > 0) {
                const force = ((repelRadius - dist) / repelRadius) ** 1.5;
                const angle = Math.atan2(dy, dx);
                // Push away
                pt.vx += Math.cos(angle) * force * 2.8;
                pt.vy += Math.sin(angle) * force * 2.8;
                // Add mouse velocity swirl wake
                pt.vx += mouse.vx * 0.15;
                pt.vy += mouse.vy * 0.15;
              }
            }

            // Wrap around edges gracefully
            if (pt.y < -15) {
              pt.y = height + 10;
              pt.x = Math.random() * width;
            } else if (pt.y > height + 15) {
              pt.y = -10;
              pt.x = Math.random() * width;
            }
            if (pt.x < -15) pt.x = width + 10;
            else if (pt.x > width + 15) pt.x = -10;
          }

          // Twinkling organic pulse
          const pulse =
            Math.sin(timeSec * (pt.pulseSpeed * 60) + pt.pulsePhase) * 0.25;
          const currentAlpha = Math.max(
            0.08,
            Math.min(1, pt.baseAlpha + pulse)
          );

          // Render particle
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);

          if (isDark) {
            // Dark mode: Starlight & Aurora fireflies
            if (pt.isGold) {
              ctx.fillStyle = `rgba(165, 180, 252, ${currentAlpha * 0.85})`; // Indigo-blue starlight
            } else {
              ctx.fillStyle = `rgba(110, 231, 183, ${currentAlpha * 0.75})`; // Emerald aurora glow
            }
          } else {
            // Light mode: Sun-dusted golden specks & diamond air motes
            if (pt.isGold) {
              ctx.fillStyle = `rgba(245, 158, 11, ${currentAlpha * 0.7})`; // Warm golden sun speck
            } else {
              ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`; // Clean solar highlight
            }
          }
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    }

    // Handle tab visibility to pause render loop and save 100% CPU when tab is hidden
    function onVisibilityChange() {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [interactive, showClouds, showParticles, showSpotlight]);

  return (
    <div
      ref={containerRef}
      aria-hidden='true'
      className='fixed inset-0 pointer-events-none z-0 overflow-hidden select-none'
    >
      {/* ─────────────────────────────────────────────────────────────
          1. PINNED CLOUDY SKY FOUNDATION LAYER
          High-definition photorealistic Cirrus sky texture with scroll parallax
          ───────────────────────────────────────────────────────────── */}
      <motion.div
        className='absolute inset-0 pointer-events-none dark:brightness-[0.35] dark:saturate-50 transition-all duration-700'
        style={{
          backgroundImage: "url('/sky.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          y,
          scale,
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. DYNAMIC CELESTIAL MOUSE SPOTLIGHT (LERP-DRIVEN INERTIA)
          Follows cursor smoothly across the sky.
          Light mode: Radiant golden sunbeam & warm flare.
          Dark mode: Ethereal cosmic moonlight & emerald-violet aurora.
          ───────────────────────────────────────────────────────────── */}
      {showSpotlight && (
        <div
          ref={spotlightRef}
          className='absolute -top-[300px] -left-[300px] w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none will-change-transform transition-opacity duration-500 bg-gradient-to-br from-amber-200/35 via-amber-100/20 to-transparent dark:from-indigo-500/25 dark:via-emerald-500/15 dark:to-transparent'
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. STATIC COMPASS SUN GLOW (Atmospheric anchor top-right)
          Ensures horizon depth even when cursor is at bottom-left
          ───────────────────────────────────────────────────────────── */}
      <div className='absolute -top-32 right-0 w-[550px] h-[550px] bg-amber-100/25 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none transition-colors duration-700' />

      {/* ─────────────────────────────────────────────────────────────
          4. INTERACTIVE ATMOSPHERE CANVAS
          Renders real drifting volumetric clouds, repellent cursor physics,
          floating celestial particles, and shockwave click ripples.
          ───────────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className='absolute inset-0 pointer-events-none z-0 w-full h-full'
      />
    </div>
  );
}

export default CoinTrackSkyBackground;
