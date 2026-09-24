'use client';

import { useTheme } from '@/shared/providers/ThemeProvider';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Before mount: render unchecked (matches server HTML exactly — no mismatch)
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <label
      className='ct-theme-switch'
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <input
        type='checkbox'
        checked={isDark}
        onChange={() => mounted && setTheme(isDark ? 'light' : 'dark')}
      />
      <span className='ct-theme-slider' />
    </label>
  );
}

export default ThemeToggle;

