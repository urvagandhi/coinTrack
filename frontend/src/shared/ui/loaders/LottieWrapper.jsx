'use client';

import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';

const LottieWrapper = forwardRef(function LottieWrapper(
  {
    animationData,
    src,
    loop = true,
    autoplay = true,
    themeAware = false,
    glow, // 'coin' | 'card' | 'gold' | 'cyan' | 'none'
    className = '',
    style,
    lottieRef,
    renderer = 'svg',
    rendererSettings,
    speed = 1,
    direction = 1,
    onComplete,
    onLoopComplete,
    ...rest
  },
  ref
) {
  const containerRef = useRef(null);
  const animInstanceRef = useRef(null);

  useImperativeHandle(ref, () => containerRef.current);

  useEffect(() => {
    let isCancelled = false;
    let anim = null;

    let data = animationData || src;
    if (data && typeof data === 'object' && data.default) {
      data = data.default;
    }

    if (!data || !containerRef.current) return;

    // Load lottie-web dynamically on client only to avoid SSR issues
    import('lottie-web').then(module => {
      if (isCancelled || !containerRef.current) return;

      const lottie = module.default || module;

      // Clean up previous animation instance
      if (animInstanceRef.current) {
        try {
          animInstanceRef.current.destroy();
        } catch {}
        animInstanceRef.current = null;
      }

      // Clear container DOM
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        // Deep clone JSON data to prevent TypeError from lottie-web modifying frozen Next.js JSON imports
        const animData =
          typeof data === 'object'
            ? JSON.parse(JSON.stringify(data))
            : undefined;

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer,
          loop,
          autoplay,
          animationData: animData,
          path: typeof data === 'string' ? data : undefined,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            clearCanvas: true,
            progressiveLoad: true,
            hideOnTransparent: true,
            ...rendererSettings,
          },
        });

        animInstanceRef.current = anim;

        if (lottieRef) {
          if (typeof lottieRef === 'function') {
            lottieRef(anim);
          } else {
            lottieRef.current = anim;
          }
        }

        if (speed !== 1) anim.setSpeed(speed);
        if (direction !== 1) anim.setDirection(direction);

        if (onComplete) anim.addEventListener('complete', onComplete);
        if (onLoopComplete)
          anim.addEventListener('loopComplete', onLoopComplete);
      } catch (err) {
        console.error('[LottieWrapper] Error loading animation:', err);
      }
    });

    return () => {
      isCancelled = true;
      if (anim) {
        try {
          anim.destroy();
        } catch {}
      }
      if (animInstanceRef.current) {
        try {
          animInstanceRef.current.destroy();
        } catch {}
        animInstanceRef.current = null;
      }
    };
  }, [
    animationData,
    src,
    loop,
    autoplay,
    renderer,
    speed,
    direction,
    lottieRef,
    onComplete,
    onLoopComplete,
    rendererSettings,
  ]);

  const rawData = animationData || src;
  const dataObj =
    rawData && typeof rawData === 'object' && rawData.default
      ? rawData.default
      : rawData;
  const isCoin =
    glow === 'coin' ||
    glow === 'gold' ||
    (glow !== 'none' &&
      dataObj?.layers?.some(l => l.nm?.toLowerCase().includes('coin')));
  const isCard =
    glow === 'card' ||
    glow === 'cyan' ||
    (glow !== 'none' &&
      dataObj?.layers?.some(l => l.nm?.toLowerCase().includes('card')));
  const isInvestor =
    glow === 'investor' ||
    glow === 'emerald' ||
    (glow !== 'none' &&
      dataObj?.layers?.some(
        l =>
          l.nm?.toLowerCase().includes('investor') ||
          l.nm?.toLowerCase().includes('business')
      ));

  const glowClass = isCoin
    ? 'lottie-coin-glow'
    : isCard
      ? 'lottie-card-glow'
      : isInvestor
        ? 'lottie-investor-glow'
        : '';

  return (
    <div
      ref={containerRef}
      className={`lottie-wrapper ${glowClass} ${themeAware ? 'lottie-theme-aware' : ''} relative flex items-center justify-center w-full h-full overflow-visible ${className}`}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
      {...rest}
    />
  );
});

export default LottieWrapper;
