'use client';

import { AnimatePresence, motion } from 'framer-motion';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Forgot Password Page - Feature Temporarily Disabled
 *
 * Note: The legacy OTP-based password reset flow has been removed as part of
 * the TOTP migration. A new password reset mechanism (email link-based) will
 * be implemented in a future update.
 *
 * TODO: Implement email link-based password reset:
 * 1. Backend: Create /api/auth/forgot-password endpoint that sends reset link
 * 2. Backend: Create /api/auth/reset-password endpoint that validates token + sets new password
 * 3. Frontend: Update this page to collect email and show confirmation
 * 4. Frontend: Create /reset-password/[token] page to handle reset link
 */

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-300">
            {/* Background Orbs */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10 px-6"
            >
                {/* Glassmorphic Card */}
                <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6 group">
                            <div className="w-16 h-16 relative mx-auto transition-transform group-hover:scale-110 duration-300">
                                <Image
                                    src="/coinTrack.png"
                                    alt="coinTrack Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </Link>

                        {/* Icon */}
                        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>

                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                            Feature Coming Soon
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Password reset is being upgraded to a more secure email-based system.
                        </p>
                    </div>

                    {/* Info Box */}
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm px-4 py-4 rounded-xl"
                        >
                            <p className="font-medium mb-2">In the meantime:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                                <li>Contact support if you're locked out</li>
                                <li>Use your backup codes if you have TOTP issues</li>
                                <li>Check back soon for the new reset feature</li>
                            </ul>
                        </motion.div>
                    </AnimatePresence>

                    {/* Back to Login Button */}
                    <Link
                        href="/login"
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Login
                    </Link>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Need help?{' '}
                            <a href="mailto:support@cointrack.app" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} coinTrack. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
