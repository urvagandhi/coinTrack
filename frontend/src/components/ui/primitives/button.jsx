import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button font-sans inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-150 ease-out outline-none select-none cursor-pointer focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm border border-transparent',
        secondary:
          'bg-muted/50 text-foreground border border-border/40 hover:bg-muted/80 backdrop-blur-md shadow-xs',
        outline:
          'border border-border/60 text-foreground bg-background/50 hover:bg-muted/40 backdrop-blur-md shadow-xs',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent',
        destructive:
          'bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-400/30',
        success:
          'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-400/30',
        warning:
          'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 dark:text-amber-400 dark:border-amber-400/30',
        link: 'text-blue-600 dark:text-blue-400 font-medium underline-offset-4 hover:underline border border-transparent',
        gain: 'bg-gain text-gain-foreground hover:bg-gain/90 border border-transparent shadow-xs font-medium',
        loss: 'bg-loss text-loss-foreground hover:bg-loss/90 border border-transparent shadow-xs font-medium',
        gainOutline: 'border border-gain/40 text-gain hover:bg-gain/10',
        lossOutline: 'border border-loss/40 text-loss hover:bg-loss/10',
      },
      size: {
        default:
          'h-9 gap-2 px-3.5 text-[13px] rounded-xl has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
        xs: "h-6.5 gap-1 rounded-lg px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[10px] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 gap-2 px-5 text-sm rounded-xl font-medium',
        xl: 'h-11 gap-2.5 px-6 text-[15px] rounded-2xl font-medium',
        icon: 'size-9 rounded-xl',
        'icon-xs': "size-6.5 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          "size-8 rounded-[10px] [&_svg:not([class*='size-'])]:size-3.5",
        'icon-lg': 'size-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
