// src/app/(access)/forgot-password/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { passwordAPI } from '@/lib/api';
import { itemVariants, useMotionVariants } from '@/lib/motion';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const item = useMotionVariants(itemVariants);

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
        } catch (err) {
            if (err.status >= 500) {
                setError('Something went wrong. Please try again later.');
            } else {
                setSubmitted(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const title = submitted ? 'Check your email' : 'Reset your password';
    const subtitle = submitted ? undefined : 'Enter your email, username, or phone number';

    return (
        <AuthPageShell title={title} subtitle={subtitle} maxWidth="sm">
            <AnimatePresence mode="wait">
                {!submitted ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthAlert type="error" message={error} />

                            <AuthFormField label="Email, username, or phone" id="identifier">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        id="identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="Email, username, or mobile"
                                        disabled={loading}
                                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400 disabled:opacity-60"
                                    />
                                </div>
                            </AuthFormField>

                            <AuthSubmitButton isLoading={loading}>
                                {loading ? 'Sending...' : 'Send reset link'}
                            </AuthSubmitButton>
                        </form>

                        <motion.div variants={item} className="mt-5 text-center">
                            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <ArrowLeft size={14} />
                                Back to sign in
                            </Link>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                    >
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                <MailCheck size={24} className="text-green-600" />
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground text-center">
                            If an account exists for <span className="text-foreground font-medium">{identifier}</span>,
                            you&apos;ll receive a password reset link within a few minutes.
                        </p>

                        <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r-lg">
                            <p className="text-xs text-blue-700">
                                Check your spam folder if you don&apos;t see the email. The link expires in 10 minutes.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => { setSubmitted(false); setIdentifier(''); }}
                                className="w-full text-sm text-purple-600 hover:underline"
                            >
                                Try a different email
                            </button>
                            <Link href="/login" className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                Return to sign in
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthPageShell>
    );
}
