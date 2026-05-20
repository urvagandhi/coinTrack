// src/components/auth/AuthFormField.jsx
'use client';

import { AlertCircle } from 'lucide-react';

export function AuthFormField({ label, id, error, hint, children }) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="block eyebrow-strong">
                    {label}
                </label>
            )}
            {children}
            {hint && !error && (
                <p className="text-[11px] text-muted-foreground font-mono">{hint}</p>
            )}
            {error && (
                <p className="text-[11px] text-[hsl(var(--loss))] flex items-center gap-1.5 font-mono">
                    <AlertCircle size={11} />
                    {error}
                </p>
            )}
        </div>
    );
}
