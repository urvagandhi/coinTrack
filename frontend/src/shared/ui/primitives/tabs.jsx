'use client';

import { cva } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

function Tabs({ className, orientation = 'horizontal', ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot='tabs'
      data-orientation={orientation}
      className={cn(
        'group/tabs flex w-full data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row data-[orientation=vertical]:gap-8 gap-6',
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex items-center justify-center rounded-[20px] p-1.5 text-muted-foreground shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-popover/80 backdrop-blur-xl border border-border/50 data-[orientation=horizontal]:w-fit data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: '',
        line: 'gap-1 bg-transparent border-0 shadow-none p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function TabsList({ className, variant = 'default', ...props }) {
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-[14px] font-semibold tracking-wide whitespace-nowrap text-muted-foreground transition-all duration-300 ease-out',
        'data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start',
        'hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:dark:bg-white/10',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
      className={cn('flex-1 text-sm outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };

