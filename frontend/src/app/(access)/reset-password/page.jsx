'use client';

import { passwordAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Lock from 'lucide-react/dist/esm/icons/lock';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

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

        // Prevent double verification (React Strict Mode calls useEffect twice)
        if (verificationStarted.current) {
            return;
        }
        verificationStarted.current = true;

        verifyToken(token);
    }, [searchParams]);

    const verifyToken = async (token) => {
        try {
            const result = await passwordAPI.forgotVerify(token);
            setTempToken(result.tempToken);
            setStep('form');
        } catch (error) {
            setStep('error');
            setMessage(error.message || 'Reset link has expired. Please request a new password reset.');
        }
    };

    const validatePassword = () => {
        if (newPassword.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(newPassword)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(newPassword)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(newPassword)) {
            return 'Password must contain at least one number';
        }
        if (newPassword !== confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validatePassword();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            await passwordAPI.reset(tempToken, newPassword);
            setStep('success');
            setMessage('Password reset successfully! You can now login with your new password.');
        } catch (error) {
            setError(error.message || 'Failed to reset password. Please try again.');
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

                        {/* Step Icon */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${step === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                            step === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                                'bg-purple-100 dark:bg-purple-900/30'
                            }`}>
                            {step === 'verifying' && <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />}
                            {step === 'form' && <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
                            {step === 'success' && <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />}
                            {step === 'error' && <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />}
                        </div>

                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                            {step === 'verifying' && 'Verifying Link...'}
                            {step === 'form' && 'Create New Password'}
                            {step === 'success' && 'Password Reset!'}
                            {step === 'error' && 'Reset Failed'}
                        </h2>
                        {(step === 'success' || step === 'error') && (
                            <p className="text-gray-500 dark:text-gray-400">{message}</p>
                        )}
                        {step === 'form' && (
                            <p className="text-gray-500 dark:text-gray-400">
                                Enter a new password for your account
                            </p>
                        )}
                    </div>

                    {/* Password Form */}
                    {step === 'form' && (
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

                            {/* New Password */}
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                    className="w-full pl-12 pr-12 py-3.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                    required
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    className="w-full pl-12 pr-12 py-3.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                    required
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Requirements */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                <p className={newPassword.length >= 8 ? 'text-green-600' : ''}>• At least 8 characters</p>
                                <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>• One uppercase letter</p>
                                <p className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>• One lowercase letter</p>
                                <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>• One number</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Success/Error Actions */}
                    {(step === 'success' || step === 'error') && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {step === 'success' ? (
                                <Link
                                    href="/login"
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Continue to Login
                                </Link>
                            ) : (
                                <Link
                                    href="/forgot-password"
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Request New Reset Link
                                </Link>
                            )}
                        </motion.div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Remember your password?{' '}
                            <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors">
                                Back to Login
                            </Link>
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
