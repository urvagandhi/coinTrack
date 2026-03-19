// src/components/calculators/framework/CalculatorComponents.jsx
// Framework components imported by all 32 calculator pages. Design tokens only.
'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calculator, Info, Loader2 } from 'lucide-react';

/**
 * CalculatorLayout - Main wrapper for all calculators
 * Props: title, description, category, children
 */
export function CalculatorLayout({ title, description, category, children }) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 uppercase tracking-wider">
                    {category}
                </span>
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
                {children}
            </div>
        </div>
    );
}

/**
 * InputCard - Container for calculator inputs
 * Props: title, children, onCalculate, isLoading
 */
export function InputCard({ title = 'Enter Details', children, onCalculate, isLoading }) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border px-6 py-4 border-l-4 border-l-blue-600">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            </div>
            <div className="px-6 py-5 space-y-5">
                {children}
                {onCalculate && (
                    <button
                        onClick={onCalculate}
                        disabled={isLoading}
                        className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                    <Loader2 size={14} />
                                </motion.div>
                                Calculating...
                            </>
                        ) : 'Calculate'}
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * ResultCard - Display calculation results
 * Props: title, children, isEmpty
 */
export function ResultCard({ title = 'Results', children, isEmpty }) {
    if (isEmpty) {
        return (
            <div className="bg-card border border-border rounded-xl h-fit">
                <div className="py-12 text-center">
                    <Calculator size={28} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Fill in the values and click Calculate</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden h-fit">
            <div className="border-b border-border px-6 py-4 border-l-4 border-l-success">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
                {children}
            </div>
        </div>
    );
}

/**
 * ResultMetric - Individual result display
 * Props: label, value, subValue, variant (default|success|warning|error)
 */
export function ResultMetric({ label, value, subValue, variant = 'default' }) {
    const valueClass = {
        success: 'text-green-600',
        warning: 'text-amber-700',
        error: 'text-red-600',
        default: 'text-foreground',
    }[variant];

    const bgClass = {
        success: 'bg-green-50',
        warning: 'bg-amber-50',
        error: 'bg-red-50',
        default: 'bg-accent',
    }[variant];

    return (
        <div className={cn('p-4 rounded-xl space-y-1 border border-transparent hover:border-border transition-colors', bgClass)}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <motion.p
                key={value}
                initial={{ opacity: 0.5, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn('text-2xl font-semibold tracking-tight', valueClass)}
            >
                {value}
            </motion.p>
            {subValue && (
                <p className="text-[11px] text-muted-foreground">{subValue}</p>
            )}
        </div>
    );
}

/**
 * FormField - Input with label and validation
 * Props: label, name, value, onChange, type, placeholder, prefix, suffix, min, max, step, error, tooltip
 */
export function FormField({
    label, name, value, onChange, type = 'number',
    placeholder, prefix, suffix, min, max, step, error, tooltip
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label htmlFor={name} className="text-sm font-medium text-foreground">
                    {label}
                </label>
                {tooltip && (
                    <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full" title={tooltip}>
                        {tooltip}
                    </span>
                )}
            </div>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value === 0 ? '' : value}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    step={step}
                    className={cn(
                        'flex h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground transition-colors',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/20',
                        'hover:border-gray-300',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        prefix && 'pl-7',
                        suffix && 'pr-14',
                        error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-danger/20' : 'border-border'
                    )}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide pointer-events-none select-none bg-accent px-1.5 py-0.5 rounded">
                        {suffix}
                    </span>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <Info size={11} /> {error}
                </p>
            )}
        </div>
    );
}

/**
 * BreakdownTable - Year-by-year or detailed breakdown
 * Props: headers, rows, caption
 */
export function BreakdownTable({ headers, rows, caption }) {
    if (!rows || rows.length === 0) return null;

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden mt-4">
            <div className="border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-foreground">Detailed Breakdown</h3>
                {caption && <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>}
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr className="border-b border-border bg-muted">
                            {headers.map((header, i) => (
                                <th key={i} className="py-3 px-6 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                        {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-accent transition-colors even:bg-muted/50">
                                {row.map((cell, j) => (
                                    <td key={j} className="py-3 px-6 text-muted-foreground">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * DisclaimerBanner - For tax and legal disclaimers
 * Props: title, message, variant (warning|info|default)
 */
export function DisclaimerBanner({ title = 'Disclaimer', message, variant = 'warning' }) {
    return (
        <div className="flex items-start gap-2.5 p-3 bg-accent border border-border rounded-lg text-xs text-muted-foreground leading-relaxed mt-4">
            <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
                <p className="font-medium text-muted-foreground">{title}</p>
                <p className="mt-0.5">{message}</p>
            </div>
        </div>
    );
}

/**
 * ResultSkeleton - Loading placeholder
 */
export function ResultSkeleton() {
    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
        </div>
    );
}
