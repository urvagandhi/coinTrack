'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export default function FilterDropdown({
    label,
    value,
    options = [],
    onChange,
    placeholder = 'Select...',
    className,
    menuWidth = 'w-52',
}) {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {label && <span className="eyebrow text-muted-foreground">{label}</span>}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="h-8 px-3 text-[11px] font-mono tracking-[0.05em] border border-border hover:border-hairline bg-card text-foreground hover:bg-muted transition-colors rounded-sm flex items-center gap-2 outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    >
                        <span>{selectedOption?.label || placeholder}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 ml-1" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={cn('rounded-sm border-hairline bg-card shadow-lg z-50', menuWidth)}>
                    {label && (
                        <>
                            <DropdownMenuLabel className="eyebrow text-[10px] px-2 py-1.5">{label}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    {options.map((opt) => {
                        const isSelected = value === opt.value;
                        return (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => onChange(opt.value)}
                                className={cn(
                                    'cursor-pointer text-[12px] font-mono px-2 py-2 flex items-center justify-between transition-colors',
                                    isSelected ? 'bg-muted text-[hsl(var(--accent))] font-medium' : 'text-foreground hover:bg-muted/50'
                                )}
                            >
                                <span>{opt.label}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
