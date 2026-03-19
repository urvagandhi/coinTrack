// src/app/(access)/reset-2fa/page.jsx
'use client';

import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { twofaAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldOff, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function Reset2FAContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');
    const verificationStarted = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStep('error');
            setMessage('Invalid recovery link. Please request a new 2FA recovery.');
            return;
        }
        if (verificationStarted.current) return;
        verificationStarted.current = true;

        verifyToken(token);
    }, [searchParams]);

    const verifyToken = async (token) => {
        try {
            const result = await twofaAPI.verifyRecovery(token);
            setStep('success');
            setMessage(result.message || '2-Factor Authentication has been disabled.');
        } catch (err) {
            setStep('error');
            setMessage(err.message || 'Recovery link has expired or is invalid.');
        }
    };

    const titles = {
        verifying: 'Disabling 2FA...',
        success: '2FA disabled',
        error: 'Recovery failed',
    };

    const subtitles = {
        verifying: 'Please wait while we process your recovery request',
        success: 'Two-factor authentication has been disabled on your account.',
        error: message,
    };

    return (
        <AuthPageShell title={titles[step]} subtitle={subtitles[step]} maxWidth="sm" showFooterLinks={false}>
            <AnimatePresence mode="wait">
                {step === 'verifying' && (
                    <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-6">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600" />
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                <ShieldOff size={24} className="text-amber-600" />
                            </div>
                        </div>

                        <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded-r-lg">
                            <p className="text-xs text-amber-700 font-medium">
                                Your account is now less secure. You will be required to set up two-factor authentication on your next login.
                            </p>
                        </div>

                        <Link href="/login" className="block">
                            <AuthSubmitButton type="button" isLoading={false}>
                                Sign in
                            </AuthSubmitButton>
                        </Link>
                    </motion.div>
                )}

                {step === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                                <XCircle size={24} className="text-red-600" />
                            </div>
                        </div>

                        <div className="space-y-2 text-center">
                            <a href="mailto:support@cointrack.app" className="text-sm text-purple-600 hover:underline">
                                Contact support
                            </a>
                            <Link href="/login" className="block text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                Return to sign in
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthPageShell>
    );
}

export default function Reset2FAPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="w-5 h-5 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin" />
            </div>
        }>
            <Reset2FAContent />
        </Suspense>
    );
}
