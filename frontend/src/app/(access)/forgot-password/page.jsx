'use client';

import { authAPI, tokenManager, userAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Loader from 'lucide-react/dist/esm/icons/loader';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Steps definition
const STEPS = {
    IDENTITY: 0,
    OTP: 1,
    RESET: 2,
    SUCCESS: 3
};

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(STEPS.IDENTITY);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form States
    const [identity, setIdentity] = useState(''); // Email/Username
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Session State (from Verify OTP step)
    const [verifiedUserId, setVerifiedUserId] = useState(null);

    // Timer State
    const [timer, setTimer] = useState(0);

    // Timer effect
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Handlers
    const handleIdentitySubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!identity.trim()) {
            setError('Please enter your email or username');
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.resendOtp(identity);
            setTimer(30);
            setStep(STEPS.OTP);
        } catch (err) {
            logger.error('Identity Check Failed:', { error: err });
            setError(err.userMessage || 'User not found or connection failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authAPI.verifyOtp(identity, otp);

            if (response.userId && (response.token || response.accessToken)) {
                setVerifiedUserId(response.userId);
                tokenManager.setToken(response.token || response.accessToken);
                setStep(STEPS.RESET);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            logger.error('OTP Verification Failed:', { error: err });
            setError(err.userMessage || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await userAPI.changePassword(verifiedUserId, newPassword);
            tokenManager.removeToken();
            setStep(STEPS.SUCCESS);
        } catch (err) {
            logger.error('Password Reset Failed:', { error: err });
            setError(err.userMessage || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;

        setIsLoading(true);
        setError('');
        try {
            await authAPI.resendOtp(identity);
            setTimer(30);
            // Show success via error content but with green text logic or just clear error
            // Since we duplicate login style, we don't have a toast.
            // We'll just rely on the timer resetting as visual feedback.
        } catch (err) {
            setError(err.userMessage || 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const getInputIcon = () => {
        if (!identity) return <Mail className="h-5 w-5" />;
        if (identity.includes('@')) return <Mail className="h-5 w-5" />;
        return <Mail className="h-5 w-5" />; // Default to Mail as generic user icon replacement
    };

    // Render Logic
    const renderContent = () => {
        switch (step) {
            case STEPS.IDENTITY:
                return (
                    <form className="space-y-6" onSubmit={handleIdentitySubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                Username, Email or Phone
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                    {getInputIcon()}
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={identity}
                                    onChange={(e) => setIdentity(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all"
                                    placeholder="Enter your registered ID"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Sending OTP...
                                </>
                            ) : (
                                <>
                                    Send Verification Code
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                );

            case STEPS.OTP:
                return (
                    <form className="space-y-6" onSubmit={handleOtpSubmit}>
                        <div>
                            <label className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                Enter the 6-digit code sent to your contact
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all text-center tracking-[0.5em] text-lg font-bold"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full relative py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify OTP
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center mt-4 mb-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Didn't receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={timer > 0 || isLoading}
                                    className={`font-semibold ${timer > 0
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-purple-600 hover:text-purple-500 cursor-pointer'
                                        }`}
                                >
                                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                                </button>
                            </p>
                        </div>
                    </form>
                );

            case STEPS.RESET:
                return (
                    <form className="space-y-6" onSubmit={handleResetSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    New Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all"
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all"
                                        placeholder="Re-enter password"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Set New Password
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                );

            case STEPS.SUCCESS:
                return (
                    <div className="text-center py-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Password Updated!
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            Your password has been changed successfully.
                        </p>
                        <Link
                            href="/login"
                            className="w-full block relative py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Back to Login
                        </Link>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-300">
            {/* Background Orbs - Exact match from Login */}
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
                    <div className="text-center mb-10">
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
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                            {step === STEPS.SUCCESS ? 'Success' : 'Forgot Password?'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {step === STEPS.IDENTITY && "Enter your credentials to recover your account"}
                            {step === STEPS.OTP && "Enter the verification code sent to you"}
                            {step === STEPS.RESET && "Create a strong new password"}
                            {step === STEPS.SUCCESS && "You can now login with your new credentials"}
                        </p>
                    </div>

                    {/* Progress Dots (Optional but helpful for wizard) */}
                    {step < STEPS.SUCCESS && (
                        <div className="flex gap-2 mb-8 justify-center">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${step >= i
                                        ? 'w-8 bg-gradient-to-r from-purple-600 to-blue-600'
                                        : 'w-2 bg-gray-200 dark:bg-gray-700'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Render Step Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer / Back to Login */}
                    {step !== STEPS.SUCCESS && (
                        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Remember your password?{' '}
                                <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors">
                                    Back to Login
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} coinTrack. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
