// src/app/(access)/login/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { useAuth } from '@/contexts/AuthContext';
import { itemVariants, useMotionVariants } from '@/lib/motion';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, verifyTotpLogin, verifyRecoveryLogin } = useAuth();
    const item = useMotionVariants(itemVariants);

    const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
    const [totpCode, setTotpCode] = useState('');
    const [showTotpInput, setShowTotpInput] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const otpRefs = useRef([]);

    const redirectPath = searchParams.get('redirect') || '/dashboard';

    // Load remembered username
    useEffect(() => {
        const rememberedUser = localStorage.getItem('cointrack_remembered_user');
        const wasRemembered = localStorage.getItem('cointrack_remember_me') === 'true';
        if (rememberedUser && wasRemembered) {
            setFormData((prev) => ({ ...prev, usernameOrEmail: rememberedUser }));
            setRememberMe(true);
        }
    }, []);

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
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            let credentials = { ...formData };
            if (/^\d{10}$/.test(credentials.usernameOrEmail)) {
                credentials.usernameOrEmail = '+91' + credentials.usernameOrEmail;
            } else if (/^[\d\s\-\+\(\)]+$/.test(credentials.usernameOrEmail) && /\d/.test(credentials.usernameOrEmail)) {
                credentials.usernameOrEmail = credentials.usernameOrEmail.replace(/[^0-9+]/g, '');
            }

            const result = await login(credentials, rememberMe);

            if (result.requireTotpSetup) {
                saveRememberMe(formData.usernameOrEmail);
                sessionStorage.setItem('tempToken', result.tempToken);
                router.push('/setup-2fa');
            } else if (result.requiresTotp) {
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
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTotpSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (isLoading) return;
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
                setTotpCode('');
            }
        } catch {
            setError('Verification failed. Please try again.');
            setTotpCode('');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, isRecoveryMode, tempToken, totpCode, verifyRecoveryLogin, verifyTotpLogin, redirectPath, router]);

    // Auto-submit TOTP
    useEffect(() => {
        const expectedLength = isRecoveryMode ? 8 : 6;
        if (totpCode.length === expectedLength && showTotpInput && !isLoading) {
            handleTotpSubmit();
        }
    }, [totpCode, isRecoveryMode, showTotpInput, isLoading, handleTotpSubmit]);

    const getInputIcon = () => {
        const value = formData.usernameOrEmail;
        if (!value) return <Mail size={16} />;
        if (value.includes('@')) return <Mail size={16} />;
        if (/^\d+$/.test(value) || /^\+?\d+$/.test(value)) return <Phone size={16} />;
        return <User size={16} />;
    };

    // OTP box handlers
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const char = value.slice(-1);
        const newCode = totpCode.split('');
        newCode[index] = char;
        setTotpCode(newCode.join('').slice(0, 6));
        if (char && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !totpCode[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        setTotpCode(pasted);
    };

    const title = showTotpInput ? 'Verify your identity' : 'Welcome back';
    const subtitle = showTotpInput
        ? (isRecoveryMode ? 'Enter one of your backup codes' : 'Enter the code from your authenticator app')
        : 'Sign in to your CoinTrack account';

    return (
        <AuthPageShell title={title} subtitle={subtitle} maxWidth="sm">
            <AnimatePresence mode="wait">
                {showTotpInput ? (
                    <motion.div
                        key="totp"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <form onSubmit={handleTotpSubmit} className="space-y-4">
                            {/* Back button */}
                            <button
                                type="button"
                                onClick={() => { setShowTotpInput(false); setTotpCode(''); setTempToken(''); setFormData((p) => ({ ...p, password: '' })); }}
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Back to login
                            </button>

                            {/* Identity context */}
                            <div className="bg-accent rounded-lg p-3">
                                <p className="text-sm text-muted-foreground">
                                    Verifying for <span className="text-foreground font-medium">{formData.usernameOrEmail}</span>
                                </p>
                            </div>

                            <AuthAlert type="error" message={error} />

                            {isRecoveryMode ? (
                                /* Recovery code: single input */
                                <AuthFormField label="Backup code" id="recovery-code">
                                    <input
                                        id="recovery-code"
                                        type="text"
                                        maxLength={8}
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="00000000"
                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm text-center tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors"
                                    />
                                </AuthFormField>
                            ) : (
                                /* TOTP: 6-box OTP input */
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium text-foreground">Authentication code</p>
                                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => { otpRefs.current[i] = el; }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={totpCode[i] || ''}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                className="w-10 h-12 text-center text-lg font-mono border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center mt-1">
                                        Make sure your device time is synced
                                    </p>
                                </div>
                            )}

                            <AuthSubmitButton
                                isLoading={isLoading}
                                disabled={isRecoveryMode ? totpCode.length !== 8 : totpCode.length !== 6}
                            >
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </AuthSubmitButton>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => { setIsRecoveryMode(!isRecoveryMode); setTotpCode(''); setError(''); }}
                                    className="text-sm text-purple-600 hover:underline"
                                >
                                    {isRecoveryMode ? 'Use authenticator app' : 'Use recovery code instead'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="credentials"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthAlert type="error" message={error} />

                            <AuthFormField label="Username, email or phone" id="usernameOrEmail">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {getInputIcon()}
                                    </div>
                                    <input
                                        id="usernameOrEmail"
                                        name="usernameOrEmail"
                                        type="text"
                                        required
                                        value={formData.usernameOrEmail}
                                        onChange={handleChange}
                                        placeholder="Enter your email, username, or phone"
                                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400"
                                    />
                                </div>
                            </AuthFormField>

                            <AuthFormField label="Password" id="password">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className="w-full h-10 pl-9 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </AuthFormField>

                            <motion.div variants={item} className="flex items-center justify-between">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-border accent-blue-600"
                                    />
                                    <span className="ml-2 text-sm text-muted-foreground">Remember me</span>
                                </label>
                                <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </motion.div>

                            <AuthSubmitButton isLoading={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </AuthSubmitButton>
                        </form>

                        <motion.div variants={item} className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="text-purple-600 font-medium hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthPageShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="w-5 h-5 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
