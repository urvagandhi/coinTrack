// src/components/auth/AuthAlert.jsx
'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const STYLES = {
    error: {
        wrap: 'border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.06)]',
        text: 'text-[hsl(var(--loss))]',
        label: 'Error',
    },
    success: {
        wrap: 'border-l-2 border-[hsl(var(--gain))] bg-[hsl(var(--gain)/0.06)]',
        text: 'text-[hsl(var(--gain))]',
        label: 'Confirmed',
    },
    warning: {
        wrap: 'border-l-2 border-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/0.06)]',
        text: 'text-[hsl(var(--chart-4))]',
        label: 'Notice',
    },
    info: {
        wrap: 'border-l-2 border-[hsl(var(--neutral))] bg-[hsl(var(--neutral)/0.06)]',
        text: 'text-[hsl(var(--neutral))]',
        label: 'Note',
    },
};

const ICONS = {
    error: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
};

export function AuthAlert({ type = 'error', message, className }) {
    if (!message) return null;

    const Icon = ICONS[type];
    const s = STYLES[type];

    return (
        <div className={cn('flex items-start gap-3 px-4 py-3', s.wrap, className)}>
            <Icon size={16} className={cn('flex-shrink-0 mt-0.5', s.text)} />
            <div className="flex-1 min-w-0">
                <p className={cn('text-[10px] uppercase tracking-[0.22em] font-semibold mb-0.5', s.text)}>
                    {s.label}
                </p>
                <p className="text-[13px] text-foreground leading-snug">{message}</p>
            </div>
        </div>
    );
}
