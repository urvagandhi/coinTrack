'use client';

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/primitives/dropdown-menu';
import { DropdownSelect } from '@/components/ui/forms/dropdown-select';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function FilterDropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select...',
  className,
  menuWidth = 'w-52',
}) {
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className='eyebrow text-muted-foreground'>{label}</span>}
      <DropdownSelect
        value={selectedOption?.label}
        placeholder={placeholder}
        menuWidth={menuWidth}
        variant='pill'
      >
        {label && (
          <>
            <DropdownMenuLabel className='eyebrow text-[10px] px-2 py-1.5'>
              {label}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map(opt => {
          const isSelected = value === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'cursor-pointer text-[12px] font-mono flex items-center justify-between',
                isSelected && 'text-blue-600 dark:text-blue-400 font-semibold'
              )}
            >
              <span>{opt.label}</span>
              {isSelected && (
                <Check className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownSelect>
    </div>
  );
}
