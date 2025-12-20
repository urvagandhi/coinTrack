'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Calculator Layout - Main wrapper for all calculators
 * Provides consistent structure and styling
 */
export function CalculatorLayout({
    title,
    description,
    category,
    children
}) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 uppercase tracking-wider">
                        {category}
                    </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">{description}</p>
            </div>

            {/* Content */}
            <div className="grid gap-8 lg:grid-cols-2">
                {children}
            </div>
        </div>
    );
}

/**
 * Input Card - Container for calculator inputs
 */
export function InputCard({ title = 'Enter Details', children, onCalculate, isLoading }) {
    return (
        <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-500 rounded-full inline-block"></span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {children}
                {onCalculate && (
                    <button
                        onClick={onCalculate}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 h-11 px-6 py-2 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Calculating...</span>
                            </div>
                        ) : 'Calculate'}
                    </button>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Result Card - Display calculation results
 */
export function ResultCard({ title = 'Results', children, isEmpty }) {
    if (isEmpty) {
        return (
            <Card className="flex items-center justify-center min-h-[200px]">
                <CardContent className="text-center text-muted-foreground">
                    <p>Enter values and click Calculate to see results</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden h-fit">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-500 rounded-full inline-block"></span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {children}
            </CardContent>
        </Card>
    );
}

/**
 * Result Metric - Individual result display
 */
export function ResultMetric({ label, value, subValue, variant = 'default' }) {
    const valueClassName = variant === 'success'
        ? 'text-green-600 dark:text-green-400'
        : variant === 'warning'
            ? 'text-amber-600 dark:text-amber-400'
            : variant === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white';

    const bgClassName = variant === 'success'
        ? 'bg-green-50 dark:bg-green-900/10'
        : variant === 'warning'
            ? 'bg-amber-50 dark:bg-amber-900/10'
            : variant === 'error'
                ? 'bg-red-50 dark:bg-red-900/10'
                : 'bg-gray-50 dark:bg-gray-800/50';

    return (
        <div className={`p-4 rounded-xl space-y-1 border border-transparent transition-colors hover:border-gray-200 dark:hover:border-gray-800 ${bgClassName}`}>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-2xl font-bold tracking-tight ${valueClassName}`}>{value}</p>
            {subValue && (
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{subValue}</p>
            )}
        </div>
    );
}

/**
 * Form Field - Input with label and validation
 */
export function FormField({
    label,
    name,
    value,
    onChange,
    type = 'number',
    placeholder,
    prefix,
    suffix,
    min,
    max,
    step,
    error,
    tooltip
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
                {tooltip && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{tooltip}</span>
                )}
            </div>
            <div className="relative group">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none pointer-events-none group-focus-within:text-purple-500 transition-colors">
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
                    className={`flex h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm ring-offset-background
            placeholder:text-gray-400 text-gray-900 dark:text-white transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500
            hover:border-gray-300 dark:hover:border-gray-600
            disabled:cursor-not-allowed disabled:opacity-50
            ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-14' : ''}
            ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium uppercase tracking-wide select-none pointer-events-none group-focus-within:text-purple-500 transition-colors bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                        {suffix}
                    </span>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}
        </div>
    );
}

/**
 * Breakdown Table - Year-by-year or detailed breakdown
 */
export function BreakdownTable({ headers, rows, caption }) {
    if (!rows || rows.length === 0) return null;

    return (
        <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Breakdown</CardTitle>
                {caption && <CardDescription className="text-gray-500 dark:text-gray-400">{caption}</CardDescription>}
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
                                {headers.map((header, i) => (
                                    <th key={i} className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rows.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    {row.map((cell, j) => (
                                        <td key={j} className="py-3 px-6 text-gray-700 dark:text-gray-300">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Disclaimer Banner - For tax and legal disclaimers
 */
export function DisclaimerBanner({ title = 'Disclaimer', message, variant = 'warning' }) {
    const bgClassName = variant === 'warning'
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        : variant === 'info'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';

    const textClassName = variant === 'warning'
        ? 'text-yellow-800 dark:text-yellow-200'
        : variant === 'info'
            ? 'text-blue-800 dark:text-blue-200'
            : 'text-gray-800 dark:text-gray-200';

    return (
        <div className={`rounded-md border p-4 ${bgClassName}`}>
            <p className={`text-sm font-medium ${textClassName}`}>{title}</p>
            <p className={`mt-1 text-sm ${textClassName} opacity-80`}>{message}</p>
        </div>
    );
}

/**
 * Loading Skeleton for results
 */
export function ResultSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </div>
            </CardContent>
        </Card>
    );
}
