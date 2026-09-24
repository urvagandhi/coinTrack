'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/primitives/dropdown-menu';
import { cn } from '@/shared/lib/utils';

export function DropdownSelect({
  value,
  placeholder = 'Select...',
  className,
  menuWidth = 'w-[240px]',
  variant = 'default',
  children,
  open,
  onOpenChange,
}) {
  const baseStyles =
    'group outline-none shadow-sm rounded-xl backdrop-blur-xl border transition-colors focus:ring-[3px] focus:ring-ring/50 cursor-pointer flex items-center justify-between';

  const variantStyles =
    variant === 'pill'
      ? 'h-8 px-3 text-[11px] font-mono tracking-[0.05em] bg-background/50 border-border/50 hover:bg-muted/50 gap-2 w-auto inline-flex'
      : 'ed-input w-full font-sans text-left bg-muted/40 border-border/40 hover:bg-muted/60 px-4 py-2.5';

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className={cn(baseStyles, variantStyles, className)}
        >
          <span
            className={
              value ? 'text-foreground font-medium' : 'text-muted-foreground'
            }
          >
            {value || placeholder}
          </span>
          <ChevronDown
            className={cn(
              'text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180',
              variant === 'pill' ? 'h-3 w-3 opacity-60 ml-1' : 'h-4 w-4'
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className={cn('font-sans p-1.5', menuWidth)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

