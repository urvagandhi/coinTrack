// src/app/(access)/not-found.js
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted dark:bg-background p-4 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <p className="text-8xl font-bold text-blue-600/20 select-none mb-2">404</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="space-y-2 mb-8"
            >
                <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
            >
                <Link href="/login">
                    <button className="h-9 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Go to login
                    </button>
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="h-9 px-4 border border-border text-foreground rounded-lg text-sm hover:bg-accent transition-colors"
                >
                    Go back
                </button>
            </motion.div>
        </div>
    );
}
