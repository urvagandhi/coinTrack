import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'group/badge font-sans inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default:
          'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/15 dark:text-blue-400 dark:border-blue-400/20',
        secondary:
          'bg-muted/50 text-foreground border-border/40 hover:bg-muted/80 backdrop-blur-md',
        destructive:
          'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/15 dark:text-rose-400 dark:border-rose-400/20',
        success:
          'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-400/20',
        warning:
          'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15 dark:text-amber-400 dark:border-amber-400/20',
        info: 'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/15 dark:text-slate-400 dark:border-slate-400/20',
        outline:
          'border-border/60 text-muted-foreground bg-transparent hover:bg-muted/30 hover:text-foreground backdrop-blur-md',
        ghost:
          'border-transparent hover:bg-muted hover:text-foreground dark:hover:bg-muted/50',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
        gain: 'bg-gain/15 text-gain border-gain/30 dark:bg-gain/20 hover:bg-gain/25 font-mono tnum',
        loss: 'bg-loss/15 text-loss border-loss/30 dark:bg-loss/20 hover:bg-loss/25 font-mono tnum',
        neutral:
          'bg-neutral/15 text-neutral border-neutral/30 hover:bg-neutral/20 font-mono tnum',
        brokerZerodha:
          'bg-broker-zerodha/15 text-broker-zerodha border-broker-zerodha/30',
        brokerUpstox:
          'bg-broker-upstox/15 text-broker-upstox border-broker-upstox/30',
        brokerAngel:
          'bg-broker-angel/15 text-broker-angel border-broker-angel/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant = 'default', asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot='badge'
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

