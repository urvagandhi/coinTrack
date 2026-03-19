// src/components/auth/AuthSubmitButton.jsx
'use client';

import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthSubmitButton({
    isLoading,
    children,
    disabled,
    variant = 'brand',
    className,
    type = 'submit',
    onClick,
}) {
    const colorClass =
        variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/25'
            : variant === 'secondary'
                ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-600/25';

    return (
        <motion.button
            type={type}
            disabled={isLoading || disabled}
            whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
            whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
            onClick={onClick}
            className={cn(
                'w-full py-3.5 px-4 font-bold rounded-xl transition-all',
                'flex items-center justify-center gap-2',
                'disabled:opacity-70 disabled:cursor-not-allowed',
                colorClass,
                className
            )}
        >
            {isLoading && (
                <Loader className="w-5 h-5 animate-spin" />
            )}
            {children}
        </motion.button>
    );
}
