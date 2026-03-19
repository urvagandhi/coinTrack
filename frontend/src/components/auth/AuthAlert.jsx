// src/components/auth/AuthAlert.jsx
'use client';

import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const STYLES = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-300',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300',
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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm mb-4',
                STYLES[type],
                className
            )}
        >
            <Icon size={18} className="flex-shrink-0 mt-0.5" />
            <span>{message}</span>
        </motion.div>
    );
}
