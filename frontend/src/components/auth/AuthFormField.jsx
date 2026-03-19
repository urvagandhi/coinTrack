// src/components/auth/AuthFormField.jsx
'use client';

import { itemVariants, useMotionVariants } from '@/lib/motion';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export function AuthFormField({ label, id, error, children }) {
    const variants = useMotionVariants(itemVariants);

    return (
        <motion.div variants={variants} className="space-y-2">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            {children}
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {error}
                </p>
            )}
        </motion.div>
    );
}
