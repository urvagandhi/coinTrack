'use client';

import { useTheme } from '@/shared/providers/ThemeProvider';
import { Toaster as Sonner } from 'sonner';
import {
  AnimatedSuccessIcon,
  AnimatedInfoIcon,
  AnimatedWarningIcon,
  AnimatedErrorIcon,
} from './animated-icons';
import { Loader2, X } from 'lucide-react';

const Toaster = ({ ...props }) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme}
      position='top-right'
      closeButton
      className='toaster group'
      icons={{
        success: (
          <AnimatedSuccessIcon className='size-5 text-emerald-500 shrink-0' />
        ),
        info: <AnimatedInfoIcon className='size-5 text-blue-500 shrink-0' />,
        warning: (
          <AnimatedWarningIcon className='size-5 text-amber-500 shrink-0' />
        ),
        error: <AnimatedErrorIcon className='size-5 text-rose-500 shrink-0' />,
        loading: (
          <Loader2 className='size-5 animate-spin text-blue-500 shrink-0' />
        ),
        close: (
          <X className='size-3.5 text-neutral-400 hover:text-foreground transition-colors' />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-[#16171a]/95 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:border group-[.toaster]:border-black/[0.08] dark:group-[.toaster]:border-white/[0.1] group-[.toaster]:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] dark:group-[.toaster]:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-[20px] group-[.toaster]:p-4 group-[.toaster]:!pr-10 group-[.toaster]:text-foreground font-sans' +
            ' data-[type=success]:group-[.toaster]:bg-emerald-50/80 dark:data-[type=success]:group-[.toaster]:bg-emerald-950/25 data-[type=success]:group-[.toaster]:border-emerald-500/25' +
            ' data-[type=info]:group-[.toaster]:bg-blue-50/80 dark:data-[type=info]:group-[.toaster]:bg-blue-950/25 data-[type=info]:group-[.toaster]:border-blue-500/25' +
            ' data-[type=warning]:group-[.toaster]:bg-amber-50/80 dark:data-[type=warning]:group-[.toaster]:bg-amber-950/25 data-[type=warning]:group-[.toaster]:border-amber-500/25' +
            ' data-[type=error]:group-[.toaster]:bg-rose-50/80 dark:data-[type=error]:group-[.toaster]:bg-rose-950/25 data-[type=error]:group-[.toaster]:border-rose-500/25',
          title: 'font-bold text-[14px] tracking-tight text-foreground',
          description:
            'text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed',
          closeButton:
            '!left-auto !right-3 !top-3.5 !transform-none !bg-transparent !border-0 !text-neutral-400 hover:!text-foreground !w-6 !h-6 flex items-center justify-center rounded-lg hover:!bg-black/5 dark:hover:!bg-white/10 transition-colors',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
