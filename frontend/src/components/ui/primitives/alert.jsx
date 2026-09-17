import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'group/alert relative w-full overflow-hidden rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-popover/80 backdrop-blur-xl border border-border/50 p-5 text-left transition-all ' +
    'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-24 before:bg-gradient-to-b before:to-transparent before:opacity-80 ' +
    '[&>svg]:absolute [&>svg]:left-5 [&>svg]:top-[21px] [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:text-current ' +
    '[&>svg~*]:pl-[34px]',
  {
    variants: {
      variant: {
        default: 'text-foreground before:from-[hsl(var(--foreground)/0.04)]',
        info: 'text-foreground before:from-[hsl(var(--foreground)/0.08)]',
        destructive:
          'text-[hsl(var(--loss))] before:from-[hsl(var(--loss)/0.15)] *:[data-slot=alert-description]:text-[hsl(var(--loss))/80]',
        warning:
          'text-[hsl(var(--accent))] before:from-[hsl(var(--accent)/0.15)] *:[data-slot=alert-description]:text-[hsl(var(--accent))/80]',
        success:
          'text-[hsl(var(--gain))] before:from-[hsl(var(--gain)/0.15)] *:[data-slot=alert-description]:text-[hsl(var(--gain))/80]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Alert({ className, variant, ...props }) {
  return (
    <div
      data-slot='alert'
      role='alert'
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }) {
  return (
    <h5
      data-slot='alert-title'
      className={cn(
        'font-display text-[15px] font-bold text-foreground mb-1 leading-tight tracking-tight',
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }) {
  return (
    <div
      data-slot='alert-description'
      className={cn(
        'text-[13px] font-sans leading-snug text-muted-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-current [&_p:not(:last-child)]:mb-3',
        className
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }) {
  return (
    <div
      data-slot='alert-action'
      className={cn('absolute top-3 right-3', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
