// src/app/(access)/login/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

const FIELD_BASE =
    'w-full h-11 px-3 bg-transparent border border-hairline text-foreground text-[14px] ' +
    'focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))] ' +
    'transition-colors placeholder:text-muted-foreground/60';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, googleLogin, verifyTotpLogin, verifyRecoveryLogin } = useAuth();

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
    const hasAttemptedGoogleLogin = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code && !hasAttemptedGoogleLogin.current) {
            hasAttemptedGoogleLogin.current = true;
            setIsLoading(true);
            
            const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/login`;
            googleLogin(code, redirectUri).then(result => {
                if (result.requiresProfileCompletion) {
                    sessionStorage.setItem('tempToken', result.tempToken);
                    if (result.email) sessionStorage.setItem('tempEmail', result.email);
                    if (result.name) sessionStorage.setItem('tempName', result.name);
                    router.push('/complete-profile');
                } else if (result.requiresTotp) {
                    setTempToken(result.tempToken);
                    setShowTotpInput(true);
                    setError('');
                } else if (result.success) {
                    router.push(redirectPath);
                } else {
                    setError(result.error || 'Google login failed.');
                    router.replace('/login');
                }
                setIsLoading(false);
            });
        }
    }, [searchParams, googleLogin, router, redirectPath]);

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

    useEffect(() => {
        const expectedLength = isRecoveryMode ? 8 : 6;
        if (totpCode.length === expectedLength && showTotpInput && !isLoading) {
            handleTotpSubmit();
        }
    }, [totpCode, isRecoveryMode, showTotpInput, isLoading, handleTotpSubmit]);

    const getInputIcon = () => {
        const value = formData.usernameOrEmail;
        if (!value) return <Mail size={14} />;
        if (value.includes('@')) return <Mail size={14} />;
        if (/^\d+$/.test(value) || /^\+?\d+$/.test(value)) return <Phone size={14} />;
        return <User size={14} />;
    };

    const handleGoogleSignIn = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            setError('Google Client ID is not configured.');
            return;
        }
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/login`;
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
    };

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

    const title = showTotpInput
        ? (isRecoveryMode ? 'Recovery code' : 'Verify identity')
        : 'Welcome back, reader';
    const subtitle = showTotpInput
        ? (isRecoveryMode ? 'Enter one of your backup codes to continue.' : 'Enter the six-digit code from your authenticator app.')
        : 'Sign in to access your portfolio ledger.';

    return (
        <AuthPageShell
            title={title}
            subtitle={subtitle}
            index="I"
            kicker={showTotpInput ? 'Two-Factor Verification' : 'Sign In'}
            asideQuote={'"A trusted account is the foundation of every honest ledger."'}
        >
            {showTotpInput ? (
                <form onSubmit={handleTotpSubmit} className="space-y-6">
                    <button
                        type="button"
                        onClick={() => { setShowTotpInput(false); setTotpCode(''); setTempToken(''); setFormData((p) => ({ ...p, password: '' })); }}
                        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={12} />
                        Back to sign in
                    </button>

                    <div className="border-l-2 border-foreground/40 bg-muted/40 px-4 py-3">
                        <p className="eyebrow mb-1">Verifying for</p>
                        <p className="font-mono text-[13px] text-foreground truncate">{formData.usernameOrEmail}</p>
                    </div>

                    <AuthAlert type="error" message={error} />

                    {isRecoveryMode ? (
                        <AuthFormField label="Backup code" id="recovery-code" hint="Eight-digit backup code.">
                            <input
                                id="recovery-code"
                                type="text"
                                maxLength={8}
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="00000000"
                                className={`${FIELD_BASE} text-center tracking-[0.4em] font-mono`}
                            />
                        </AuthFormField>
                    ) : (
                        <div className="space-y-2">
                            <p className="eyebrow-strong">Authentication code</p>
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
                                        className="w-11 h-12 text-center text-[18px] font-mono border border-hairline bg-transparent text-foreground focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))] transition-colors"
                                    />
                                ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground text-center font-mono mt-1">
                                Ensure your device time is synced.
                            </p>
                        </div>
                    )}

                    <AuthSubmitButton
                        isLoading={isLoading}
                        disabled={isRecoveryMode ? totpCode.length !== 8 : totpCode.length !== 6}
                    >
                        {isLoading ? 'Verifying…' : 'Verify & Continue'}
                    </AuthSubmitButton>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => { setIsRecoveryMode(!isRecoveryMode); setTotpCode(''); setError(''); }}
                            className="text-[12px] uppercase tracking-[0.2em] text-[hsl(var(--accent))] hover:underline"
                        >
                            {isRecoveryMode ? 'Use authenticator app' : 'Use recovery code'}
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AuthAlert type="error" message={error} />

                        <AuthFormField label="Username · Email · Phone" id="usernameOrEmail">
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
                                    placeholder="reader@cointrack.app"
                                    className={`${FIELD_BASE} pl-9`}
                                />
                            </div>
                        </AuthFormField>

                        <AuthFormField label="Password" id="password">
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Lock size={14} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`${FIELD_BASE} pl-9 pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </AuthFormField>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-3.5 h-3.5 border border-hairline accent-[hsl(var(--accent))]"
                                />
                                <span className="ml-2 text-[12px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-foreground transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-[12px] uppercase tracking-[0.18em] text-[hsl(var(--accent))] hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <AuthSubmitButton isLoading={isLoading}>
                            {isLoading ? 'Signing in…' : 'Sign In'}
                        </AuthSubmitButton>
                        
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-hairline"></div>
                            <span className="flex-shrink-0 mx-4 text-muted-foreground text-[11px] uppercase tracking-[0.2em]">Or</span>
                            <div className="flex-grow border-t border-hairline"></div>
                        </div>
                        
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full h-11 flex items-center justify-center gap-2 bg-transparent border border-hairline text-[12px] uppercase tracking-[0.15em] hover:bg-muted/30 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-hairline">
                        <p className="text-[12px] text-muted-foreground text-center">
                            New to CoinTrack?{' '}
                            <Link
                                href="/register"
                                className="text-[hsl(var(--accent))] font-medium uppercase tracking-[0.16em] hover:underline"
                            >
                                Open an account
                            </Link>
                        </p>
                    </div>
                </>
            )}
        </AuthPageShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
