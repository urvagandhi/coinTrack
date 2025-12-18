'use client';

import { twofaAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ShieldOff from 'lucide-react/dist/esm/icons/shield-off';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function Reset2FAContent() {
    const searchParams = useSearchParams();

    const [step, setStep] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');

    // Guard against double verification in React Strict Mode
    const verificationStarted = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStep('error');
            setMessage('Invalid recovery link. Please request a new 2FA recovery.');
            return;
        }

        // Prevent double verification (React Strict Mode calls useEffect twice)
        if (verificationStarted.current) {
            return;
        }
        verificationStarted.current = true;

        verifyToken(token);
    }, [searchParams]);

    const verifyToken = async (token) => {
        try {
            const result = await twofaAPI.verifyRecovery(token);
            setStep('success');
            setMessage(result.message || '2-Factor Authentication has been disabled. You can now log in with just your password.');
        } catch (error) {
            setStep('error');
            setMessage(error.message || 'Recovery link has expired or is invalid. Please request a new 2FA recovery.');
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
                                    alt="coinTrack logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </Link>

                        {/* Icon - Dynamic based on state */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${step === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                            step === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                                'bg-purple-100 dark:bg-purple-900/30'
                            }`}>
                            {step === 'success' ? (
                                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                            ) : step === 'error' ? (
                                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            ) : (
                                <ShieldOff className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            )}
                        </div>

                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                            {step === 'verifying' ? 'Verifying Link...' :
                                step === 'success' ? '2FA Disabled' : 'Recovery Failed'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {/* Subtext can be dynamic or static */}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <AnimatePresence mode="wait">
                            {/* Verifying State */}
                            {step === 'verifying' && (
                                <motion.div
                                    key="verifying"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-4"
                                >
                                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-300">Please wait while we verify your recovery link.</p>
                                </motion.div>
                            )}

                            {/* Success State */}
                            {step === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl mb-6 text-left">
                                        <p className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                                            <span className="text-lg">⚠️</span>
                                            For your security, we strongly recommend setting up 2FA again immediately after logging in.
                                        </p>
                                    </div>

                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Go to Login
                                    </Link>
                                </motion.div>
                            )}

                            {/* Error State */}
                            {step === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6 text-left">
                                        <p className="text-sm text-red-800 dark:text-red-200">
                                            {message}
                                        </p>
                                    </div>

                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-bold rounded-xl transition-all"
                                    >
                                        Back to Login
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
                    &copy; {new Date().getFullYear()} CoinTrack. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}

export default function Reset2FAPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        }>
            <Reset2FAContent />
        </Suspense>
    );
}
