'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader, Lock, Mail, Phone, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        password: ''
    });
    // TOTP State
    const [totpCode, setTotpCode] = useState('');
    const [showTotpInput, setShowTotpInput] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false); // Toggle between TOTP and Backup Code
    const [tempToken, setTempToken] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Auth Context
    const { login, verifyTotpLogin, verifyRecoveryLogin } = useAuth();

    const redirectPath = searchParams.get('redirect') || '/dashboard';

    // Load remembered username on mount
    useEffect(() => {
        const rememberedUser = localStorage.getItem('cointrack_remembered_user');
        const wasRemembered = localStorage.getItem('cointrack_remember_me') === 'true';
        if (rememberedUser && wasRemembered) {
            setFormData(prev => ({ ...prev, usernameOrEmail: rememberedUser }));
            setRememberMe(true);
        }
    }, []);

    // Save/clear remembered username when Remember Me changes or on successful login
    const saveRememberMe = (username) => {
        if (rememberMe && username) {
            localStorage.setItem('cointrack_remembered_user', username);
            localStorage.setItem('cointrack_remember_me', 'true');
        } else {
            localStorage.removeItem('cointrack_remembered_user');
            localStorage.removeItem('cointrack_remember_me');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!formData.usernameOrEmail.trim() || !formData.password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        try {
            // Sanitize input
            let credentials = { ...formData };
            // (Phone sanitization logic preserved)
            if (/^\d{10}$/.test(credentials.usernameOrEmail)) {
                credentials.usernameOrEmail = '+91' + credentials.usernameOrEmail;
            } else if (/^[\d\s\-\+\(\)]+$/.test(credentials.usernameOrEmail) && /\d/.test(credentials.usernameOrEmail)) {
                credentials.usernameOrEmail = credentials.usernameOrEmail.replace(/[^0-9+]/g, '');
            }

            const result = await login(credentials, rememberMe);

            if (result.requireTotpSetup) {
                // Mandatory Setup Case - save remember me here since password was valid
                saveRememberMe(formData.usernameOrEmail);
                sessionStorage.setItem('tempToken', result.tempToken);
                router.push('/setup-2fa');
            } else if (result.requiresTotp) {
                // TOTP Verification Case - save remember me here since password was valid
                saveRememberMe(formData.usernameOrEmail);
                setTempToken(result.tempToken);
                setShowTotpInput(true);
                setError('');
            } else if (result.success) {
                saveRememberMe(formData.usernameOrEmail);
                router.push(redirectPath);
            } else {
                setError(result.error || 'Invalid credentials.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTotpSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isLoading) return; // Prevent double-submit
        setError('');
        setIsLoading(true);

        try {
            let result;
            if (isRecoveryMode) {
                result = await verifyRecoveryLogin(tempToken, totpCode);
            } else {
                result = await verifyTotpLogin(tempToken, totpCode);
            }

            if (result.success) {
                router.push(redirectPath);
            } else {
                setError(result.error || 'Invalid code. Please try again.');
                setTotpCode(''); // Clear on error for retry
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
            setTotpCode(''); // Clear on error for retry
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-submit when correct code length is entered
    useEffect(() => {
        const expectedLength = isRecoveryMode ? 8 : 6;
        if (totpCode.length === expectedLength && showTotpInput && !isLoading) {
            handleTotpSubmit();
        }
    }, [totpCode, isRecoveryMode, showTotpInput]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const getInputIcon = () => {
        const value = formData.usernameOrEmail;
        if (!value) return <Mail className="h-5 w-5" />;
        if (value.includes('@')) return <Mail className="h-5 w-5" />;
        if (/^\d+$/.test(value) || /^\+?\d+$/.test(value)) return <Phone className="h-5 w-5" />;
        return <User className="h-5 w-5" />;
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
                            {showTotpInput ? 'Security Check' : 'Welcome Back'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {showTotpInput
                                ? (isRecoveryMode ? 'Enter one of your backup codes' : 'Enter the code from your Authenticator app')
                                : 'Enter your credentials to access your account'}
                        </p>
                    </div>

                    {/* TOTP Form */}
                    {showTotpInput ? (
                        <form className="space-y-6" onSubmit={handleTotpSubmit}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </motion.div>
                            )}

                            <div>
                                <label className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    {isRecoveryMode ? 'Backup Code' : 'Authentication Code'}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={isRecoveryMode ? 8 : 6}
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all text-center tracking-[0.5em] text-lg font-bold"
                                        placeholder={isRecoveryMode ? "00000000" : "000000"}
                                    />
                                </div>
                                <div className="mt-2 text-center text-xs text-yellow-600 dark:text-yellow-500">
                                    {!isRecoveryMode && '🕒 Make sure your device time is synced.'}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || (isRecoveryMode ? totpCode.length !== 8 : totpCode.length !== 6)}
                                className="w-full relative py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Verify {isRecoveryMode ? 'Backup Code' : 'TOTP'}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRecoveryMode(!isRecoveryMode);
                                        setTotpCode('');
                                        setError('');
                                    }}
                                    className="text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors"
                                >
                                    {isRecoveryMode ? 'Use Authenticator App' : 'Use Backup Code'}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowTotpInput(false);
                                    setTotpCode('');
                                    setTempToken('');
                                    setFormData(prev => ({ ...prev, password: '' }));
                                }}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-2"
                            >
                                Back to Login
                            </button>
                        </form>
                    ) : (
                        /* Login Form */
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                        Username, Email or Phone
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                            {getInputIcon()}
                                            {/^\d+$/.test(formData.usernameOrEmail) && (
                                                <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm border-l border-gray-300 dark:border-gray-600 pl-2 font-medium">+91</span>
                                            )}
                                        </div>
                                        <input
                                            name="usernameOrEmail"
                                            type="text"
                                            required
                                            value={formData.usernameOrEmail}
                                            onChange={handleChange}
                                            className={`block w-full py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all ${/^\d+$/.test(formData.usernameOrEmail) ? 'pl-28' : 'pl-12'
                                                } pr-4`}
                                            placeholder="Enter your email, username, or phone"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="block w-full pl-12 pr-12 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all"
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full relative py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <Link href="/register" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors">
                                Create an account
                            </Link>
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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
