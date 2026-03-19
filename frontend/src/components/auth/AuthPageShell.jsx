// src/components/auth/AuthPageShell.jsx
'use client';

import { containerVariants, itemVariants, useMotionVariants } from '@/lib/motion';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function AuthPageShell({
    title,
    subtitle,
    maxWidth = 'sm',
    showFooterLinks = true,
    children,
}) {
    const container = useMotionVariants(containerVariants);
    const item = useMotionVariants(itemVariants);
    const widthClass = maxWidth === 'md' ? 'max-w-md' : 'max-w-sm';

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-300 p-4">
            {/* Background Orbs */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                className={`w-full ${widthClass} relative z-10`}
            >
                {/* Glassmorphic Card */}
                <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10">
                    {/* Logo + Title */}
                    <motion.div variants={item} className="text-center mb-10">
                        <Link href="/" className="inline-block mb-6 group">
                            <div className="w-16 h-16 relative mx-auto transition-transform group-hover:scale-110 duration-300">
                                <Image
                                    src="/coinTrack.png"
                                    alt="coinTrack logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </Link>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
                        )}
                    </motion.div>

                    {/* Page content */}
                    {children}
                </div>
            </motion.div>

            {/* Page footer */}
            {showFooterLinks && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="absolute bottom-4 text-xs text-gray-400 text-center"
                >
                    &copy; {new Date().getFullYear()} CoinTrack &middot;{' '}
                    <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        Privacy
                    </Link>
                    {' \u00b7 '}
                    <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        Terms
                    </Link>
                </motion.p>
            )}
        </div>
    );
}
