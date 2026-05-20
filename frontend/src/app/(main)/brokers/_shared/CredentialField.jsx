'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

export function CredentialField({ field, value, onChange, isSaved, onEdit, disabled }) {
    const [showValue, setShowValue] = useState(false);
    const last4 = value ? value.slice(-4) : '••••';

    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase font-semibold text-foreground">
                    {field.label}
                    {field.sensitive && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                </label>
                {isSaved && (
                    <span className="text-[10px] font-mono text-[hsl(var(--gain))] tnum">stored ✓</span>
                )}
            </div>

            {isSaved ? (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-10 border border-border bg-muted px-3 flex items-center font-mono text-[12px] text-muted-foreground rounded-sm tnum">
                        ••••••••{last4}
                    </div>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="ed-btn ed-btn-ghost h-10"
                    >
                        Edit
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <input
                        type={field.sensitive && !showValue ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={disabled}
                        className={`w-full h-10 px-3 ${field.sensitive ? 'pr-10' : ''} bg-background border border-input text-[13px] text-foreground placeholder:text-muted-foreground/60 rounded-sm transition-colors focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))]/30 font-mono tnum disabled:opacity-50`}
                    />
                    {field.sensitive && (
                        <button
                            type="button"
                            onClick={() => setShowValue((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                    )}
                </div>
            )}

            {field.helpText && !isSaved && (
                <p className="text-[11px] text-muted-foreground font-serif italic leading-relaxed">{field.helpText}</p>
            )}
        </div>
    );
}
