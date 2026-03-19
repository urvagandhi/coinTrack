// src/app/(access)/verify-email/page.jsx
'use client';

import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { emailAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading | success | already | error
    const [message, setMessage] = useState('');
    const [isChange, setIsChange] = useState(false);
    const verificationStarted = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Please check your email and try again.');
            return;
        }
        if (verificationStarted.current) return;
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
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Email verification failed. The link may have expired.');
        }
    };

    const titles = {
        loading: 'Verifying...',
        success: isChange ? 'Email changed' : 'Email verified',
        already: 'Already verified',
        error: 'Verification failed',
    };

    const subtitles = {
        loading: 'Verifying your email address',
        success: isChange ? 'Your email address has been updated.' : 'Your email address has been verified.',
        already: 'This email address has already been verified.',
        error: message,
    };

    return (
        <AuthPageShell title={titles[status]} subtitle={subtitles[status]} maxWidth="sm" showFooterLinks={false}>
            {status === 'loading' && (
                <div className="flex justify-center py-6">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600"
                    />
                </div>
            )}

            {(status === 'success' || status === 'already') && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                            {status === 'success' ? <MailCheck size={24} className="text-green-600" /> : <CheckCircle2 size={24} className="text-green-600" />}
                        </div>
                    </div>
                    <Link href="/dashboard" className="block">
                        <AuthSubmitButton type="button" isLoading={false}>
                            Go to dashboard
                        </AuthSubmitButton>
                    </Link>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                            <XCircle size={24} className="text-red-600" />
                        </div>
                    </div>
                    <Link href="/dashboard" className="block">
                        <AuthSubmitButton type="button" isLoading={false}>
                            Return to dashboard
                        </AuthSubmitButton>
                    </Link>
                </motion.div>
            )}
        </AuthPageShell>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="w-5 h-5 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
