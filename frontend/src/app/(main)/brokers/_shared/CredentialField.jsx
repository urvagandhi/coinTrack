// src/app/(main)/brokers/_shared/CredentialField.jsx
'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

export function CredentialField({ field, value, onChange, isSaved, onEdit, disabled }) {
    const [showValue, setShowValue] = useState(false);

    const maskedLast4 = value ? value.slice(-4) : '••••';

    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
                {field.label}
                {field.sensitive && <Lock size={11} className="inline ml-1.5 text-muted-foreground" />}
            </label>

            {isSaved ? (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-10 px-3 flex items-center bg-background border border-border rounded-lg">
                        <span className="text-sm font-mono text-muted-foreground">
                            ••••••••{maskedLast4}
                        </span>
                    </div>
                    <button onClick={onEdit}
                        className="h-10 px-3 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
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
                        className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    />
                    {field.sensitive && (
                        <button type="button" onClick={() => setShowValue((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showValue ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    )}
                </div>
            )}

            {field.helpText && !isSaved && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
        </div>
    );
}
