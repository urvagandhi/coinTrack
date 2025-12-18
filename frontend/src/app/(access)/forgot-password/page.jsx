'use client';

import { passwordAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Forgot Password Page
 *
 * Accepts email, username, or mobile number.
 * Always shows success message to prevent user enumeration.
 */

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!identifier.trim()) {
            setError('Please enter your email, username, or mobile number');
            return;
        }

        setLoading(true);

        try {
            await passwordAPI.forgot(identifier.trim());
            setSubmitted(true);
        } catch (error) {
            // Even on error, show success to prevent enumeration
            // Only show error for network/server issues
            if (error.status >= 500) {
                setError('Something went wrong. Please try again later.');
            } else {
                setSubmitted(true);
            }
        } finally {
            setLoading(false);
        }
    };

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
                                    alt="CoinTrack Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </Link>

                        {/* Icon */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${submitted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
                            }`}>
                            {submitted ? (
                                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                            ) : (
                                <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            )}
                        </div>

                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                            {submitted ? 'Check Your Email' : 'Forgot Password?'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {submitted
                                ? 'If an account exists with this identifier, you will receive a password reset link.'
                                : 'Enter your email, username, or mobile number to receive a reset link.'
                            }
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error Display */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Identifier Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Email, username, or mobile"
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                    disabled={loading}
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Info Box */}
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm px-4 py-4 rounded-xl">
                                <p className="font-medium mb-2">What happens next:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                                    <li>Check your email inbox</li>
                                    <li>Click the reset link (expires in 10 min)</li>
                                    <li>Create a new password</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setIdentifier('');
                                }}
                                className="w-full py-3.5 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all"
                            >
                                Try Different Email
                            </button>
                        </motion.div>
                    )}

                    {/* Back to Login Button */}
                    <div className="mt-4">
                        <Link
                            href="/login"
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Login
                        </Link>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Need help?{' '}
                            <a href="mailto:support@cointrack.app" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} CoinTrack. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
