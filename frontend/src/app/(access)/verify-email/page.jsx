'use client';

import { emailAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Mail from 'lucide-react/dist/esm/icons/mail';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [status, setStatus] = useState('loading'); // loading | success | already | error
    const [message, setMessage] = useState('');
    const [isChange, setIsChange] = useState(false);

    // Guard against double verification in React Strict Mode
    const verificationStarted = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Please check your email and try again.');
            return;
        }

        // Prevent double verification (React Strict Mode calls useEffect twice)
        if (verificationStarted.current) {
            return;
        }
        verificationStarted.current = true;

        setIsChange(type === 'change');
        verifyEmail(token, type);
    }, [searchParams]);

    const verifyEmail = async (token, type) => {
        try {
            const result = await emailAPI.verify(token, type);

            if (result.alreadyVerified) {
                setStatus('already');
                setMessage(result.message || 'Your email has already been verified.');
            } else {
                setStatus('success');
                setMessage(result.message || 'Email verified successfully!');
            }
        } catch (error) {
            setStatus('error');
            setMessage(error.message || 'Email verification failed. The link may have expired.');
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'loading':
                return <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />;
            case 'success':
            case 'already':
                return <CheckCircle2 className="w-12 h-12 text-green-500" />;
            case 'error':
                return <XCircle className="w-12 h-12 text-red-500" />;
            default:
                return <Mail className="w-12 h-12 text-purple-600" />;
        }
    };

    const getTitle = () => {
        switch (status) {
            case 'loading':
                return 'Verifying...';
            case 'success':
                return isChange ? 'Email Changed!' : 'Email Verified!';
            case 'already':
                return 'Already Verified';
            case 'error':
                return 'Verification Failed';
            default:
                return 'Email Verification';
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-300">
            {/* Background Orbs */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-green-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
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

                        {/* Status Icon */}
                        <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            {getIcon()}
                        </div>

                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                            {getTitle()}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {message}
                        </p>
                    </div>

                    {/* Action Button */}
                    {status !== 'loading' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {(status === 'success' || status === 'already') ? (
                                <Link
                                    href="/login"
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Continue to Login
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Back to Login
                                </Link>
                            )}
                        </motion.div>
                    )}

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

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
