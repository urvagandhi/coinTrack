'use client';

import { cn } from '@/shared/lib/utils';

function Table({ className, ...props }) {
  return (
    <div
      data-slot='table-container'
      className='relative w-full overflow-x-auto [scrollbar-gutter:stable] [scrollbar-width:thin]'
    >
      <table
        data-slot='table'
        className={cn('w-full caption-bottom text-sm tabular-nums', className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot='table-header'
      className={cn(
        '[&_tr]:border-b border-border/80 bg-transparent',
        className
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'border-t border-border/80 bg-muted/30 font-medium text-xs [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'border-b border-border/60 transition-colors hover:bg-muted/40 has-aria-expanded:bg-muted/40 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'h-9 px-4 text-left align-middle text-[11px] font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'py-3 px-4 align-middle whitespace-nowrap text-[13px] text-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot='table-caption'
      className={cn('mt-4 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
