'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useServerInsertedHTML } from 'next/navigation';

const DEFAULT_THEMES = ['light', 'dark'];

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: undefined,
  systemTheme: undefined,
  themes: [...DEFAULT_THEMES, 'system'],
  setTheme: () => {},
});

function systemPref() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Minimal next-themes-compatible ThemeProvider.
 *
 * Injects the FOUC-prevention script via useServerInsertedHTML so it lives
 * outside the React tree (React 18.3+ warns about <script> inside components).
 */
export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes = DEFAULT_THEMES,
  disableTransitionOnChange = false,
}) {
  useServerInsertedHTML(() => {
    const initScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(storageKey)})||${JSON.stringify(defaultTheme)};var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var d=document.documentElement;${JSON.stringify(
      themes
    )
      .slice(1, -1)
      .split(',')
      .map(th => `d.classList.remove(${th})`)
      .join(';')};d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();`;

    return (
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: initScript }}
      />
    );
  });

  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      return localStorage.getItem(storageKey) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });
  const [systemTheme, setSystemTheme] = useState(null);

  useEffect(() => {
    const applySystem = () => setSystemTheme(systemPref());
    applySystem();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applySystem);
    return () => mq.removeEventListener('change', applySystem);
  }, []);

  const applyTheme = useCallback(
    resolved => {
      const root = document.documentElement;
      if (attribute === 'class') {
        themes.forEach(th => root.classList.remove(th));
        root.classList.add(resolved);
      } else if (attribute.startsWith('data-')) {
        root.setAttribute(attribute, resolved);
      }
      if (enableColorScheme) root.style.colorScheme = resolved;
    },
    [attribute, enableColorScheme, themes]
  );

  useEffect(() => {
    const resolved =
      enableSystem && theme === 'system' ? systemTheme || systemPref() : theme;
    applyTheme(resolved);
  }, [theme, systemTheme, enableSystem, applyTheme]);

  const setTheme = useCallback(
    next => {
      if (disableTransitionOnChange && next !== theme) {
        const style = document.createElement('style');
        style.appendChild(
          document.createTextNode(
            '*,*::before,*::after{transition:none!important}'
          )
        );
        document.head.appendChild(style);
        requestAnimationFrame(() => {
          window.getComputedStyle(document.body);
          setTimeout(() => document.head.removeChild(style), 1);
        });
      }
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {}
    },
    [theme, storageKey, disableTransitionOnChange]
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme: theme === 'system' ? systemTheme : theme,
      systemTheme,
      themes: enableSystem ? [...themes, 'system'] : themes,
    }),
    [theme, setTheme, systemTheme, enableSystem, themes]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
