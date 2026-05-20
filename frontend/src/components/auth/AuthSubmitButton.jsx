// src/components/auth/AuthSubmitButton.jsx
'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function AuthSubmitButton({
    isLoading,
    children,
    disabled,
    variant = 'brand',
    className,
    type = 'submit',
    onClick,
}) {
    const variantClass =
        variant === 'danger'
            ? 'ed-btn ed-btn-loss'
            : variant === 'secondary'
                ? 'ed-btn ed-btn-ghost'
                : variant === 'accent'
                    ? 'ed-btn ed-btn-accent'
                    : variant === 'gain'
                        ? 'ed-btn ed-btn-gain'
                        : 'ed-btn ed-btn-primary';

    return (
        <button
            type={type}
            disabled={isLoading || disabled}
            onClick={onClick}
            className={cn(
                variantClass,
                'w-full h-11 px-4',
                className
            )}
        >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
