import { cn } from '@/lib/utils';

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'flex min-h-[90px] w-full font-sans outline-none shadow-sm text-[15px] px-4 py-3 rounded-xl bg-muted/40 backdrop-blur-xl focus:bg-background border border-border/40 focus:ring-[3px] focus:ring-ring/50 transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 resize-y',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
