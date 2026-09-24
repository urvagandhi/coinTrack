import { cn } from '@/shared/lib/utils';

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'ed-input flex w-full font-sans outline-none shadow-sm text-[15px] px-4 py-2.5 rounded-xl bg-muted/40 backdrop-blur-xl focus:bg-background border border-border/40 focus:ring-[3px] focus:ring-ring/50 transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  );
}

export { Input };

