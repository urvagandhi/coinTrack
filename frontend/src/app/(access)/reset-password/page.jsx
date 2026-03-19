// src/app/(access)/reset-password/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { passwordAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, Eye, EyeOff, Lock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState('verifying'); // verifying | form | success | error
    const [tempToken, setTempToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Guard against double verification in React Strict Mode
    const verificationStarted = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStep('error');
            setMessage('Invalid reset link. Please request a new password reset.');
            return;
        }
        if (verificationStarted.current) return;
        verificationStarted.current = true;
        verifyToken(token);
    }, [searchParams]);

    const verifyToken = async (token) => {
        try {
            const result = await passwordAPI.forgotVerify(token);
            setTempToken(result.tempToken);
            setStep('form');
        } catch (err) {
            setStep('error');
            setMessage(err.message || 'Reset link has expired. Please request a new password reset.');
        }
    };

    const validatePassword = () => {
        if (newPassword.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(newPassword)) return 'Must contain an uppercase letter';
        if (!/[a-z]/.test(newPassword)) return 'Must contain a lowercase letter';
        if (!/[0-9]/.test(newPassword)) return 'Must contain a number';
        if (newPassword !== confirmPassword) return 'Passwords do not match';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const validationError = validatePassword();
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        try {
            await passwordAPI.reset(tempToken, newPassword);
            setStep('success');
        } catch (err) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const requirements = [
        { label: 'At least 8 characters', met: newPassword.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
        { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
        { label: 'One number', met: /[0-9]/.test(newPassword) },
    ];

    const titles = {
        verifying: 'Verifying link...',
        form: 'Set new password',
        success: 'Password updated',
        error: 'Reset failed',
    };

    const subtitles = {
        verifying: 'Please wait while we verify your reset link',
        form: 'Enter a new password for your account',
        success: 'Your password has been changed successfully.',
        error: message,
    };

    return (
        <AuthPageShell title={titles[step]} subtitle={subtitles[step]} maxWidth="sm" showFooterLinks={step !== 'verifying'}>
            <AnimatePresence mode="wait">
                {step === 'verifying' && (
                    <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-6">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600" />
                    </motion.div>
                )}

                {step === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                                <XCircle size={24} className="text-red-600" />
                            </div>
                        </div>
                        <AuthSubmitButton type="button" isLoading={false} onClick={() => window.location.href = '/forgot-password'}>
                            Request new reset link
                        </AuthSubmitButton>
                        <div className="text-center">
                            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                Back to sign in
                            </Link>
                        </div>
                    </motion.div>
                )}

                {step === 'form' && (
                    <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthAlert type="error" message={error} />

                            <AuthFormField label="New password" id="newPassword">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock size={16} /></div>
                                    <input
                                        id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required
                                        className="w-full h-10 pl-9 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400"
                                    />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {/* Requirements checklist */}
                                {newPassword && (
                                    <div className="mt-2 space-y-1">
                                        {requirements.map((req) => (
                                            <div key={req.label} className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                                                {req.met ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                                {req.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </AuthFormField>

                            <AuthFormField label="Confirm password" id="confirmPassword">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock size={16} /></div>
                                    <input
                                        id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required
                                        className="w-full h-10 pl-9 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </AuthFormField>

                            <AuthSubmitButton isLoading={loading}>
                                {loading ? 'Updating...' : 'Set new password'}
                            </AuthSubmitButton>
                        </form>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                <CheckCircle2 size={24} className="text-green-600" />
                            </div>
                        </div>
                        <Link href="/login" className="block">
                            <AuthSubmitButton type="button" isLoading={false}>
                                Sign in
                            </AuthSubmitButton>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthPageShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="w-5 h-5 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
