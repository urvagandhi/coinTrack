'use client';

import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

export default function StatsCard({ title, value, change, changeType = 'currency', icon, isLoading = false }) {
    const isPositive = change >= 0;

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-cointrack-dark-card rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-cointrack-light/30 dark:bg-cointrack-dark/30 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-cointrack-light/30 dark:bg-cointrack-dark/30 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-cointrack-light/30 dark:bg-cointrack-dark/30 rounded w-1/3"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-cointrack-dark-card rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-6 hover:shadow-lg transition-all duration-200"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-cointrack-dark/60 dark:text-cointrack-light/60 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-cointrack-dark dark:text-cointrack-light mb-2">
                        {typeof value === 'number' ? formatCurrency(value) : value}
                    </p>
                    {change !== undefined && (
                        <div className="flex items-center">
                            <span className={`inline-flex items-center text-sm font-medium ${isPositive
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                {isPositive ? (
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                )}
                                {changeType === 'percentage'
                                    ? formatPercentage(Math.abs(change))
                                    : formatCurrency(Math.abs(change))
                                }
                            </span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="flex-shrink-0 ml-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-cointrack-primary/10 to-cointrack-secondary/10 rounded-xl flex items-center justify-center">
                            <div className="text-cointrack-primary">
                                {icon}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}