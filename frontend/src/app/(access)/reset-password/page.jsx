// src/app/(access)/reset-password/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { passwordAPI } from '@/lib/api';
import { CheckCircle2, Circle, Eye, EyeOff, Lock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

const FIELD_BASE =
    'w-full h-11 px-3 bg-transparent border border-hairline text-foreground text-[14px] ' +
    'focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))] ' +
    'transition-colors placeholder:text-muted-foreground/60';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState('verifying');
    const [tempToken, setTempToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

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
        { label: 'Passwords match', met: confirmPassword.length > 0 && newPassword === confirmPassword },
    ];

    const titles = {
        verifying: 'Verifying link…',
        form: 'Set a new password',
        success: 'Password updated',
        error: 'Reset failed',
    };

    const subtitles = {
        verifying: 'Hold on while we verify your reset link.',
        form: 'Choose a strong password for your account.',
        success: 'Your password has been changed. You may now sign in.',
        error: message,
    };

    return (
        <AuthPageShell
            title={titles[step]}
            subtitle={subtitles[step]}
            index="IV"
            kicker="New Password"
            showFooterLinks={step !== 'verifying'}
            asideQuote={'"A new password is a quiet promise — keep it close."'}
        >
            {step === 'verifying' && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-8 h-8 rounded-full border border-hairline border-t-foreground animate-spin" />
                    <p className="eyebrow">Authenticating link</p>
                </div>
            )}

            {step === 'error' && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.06)] px-4 py-4">
                        <XCircle size={20} className="text-[hsl(var(--loss))] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="eyebrow text-[hsl(var(--loss))] mb-1">Link expired</p>
                            <p className="text-[13px] text-foreground leading-snug">{message}</p>
                        </div>
                    </div>

                    <AuthSubmitButton
                        type="button"
                        isLoading={false}
                        onClick={() => window.location.href = '/forgot-password'}
                    >
                        Request New Reset Link
                    </AuthSubmitButton>

                    <div className="text-center pt-2">
                        <Link href="/login" className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            )}

            {step === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <AuthAlert type="error" message={error} />

                    <AuthFormField label="New password" id="newPassword">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock size={14} /></div>
                            <input
                                id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required
                                className={`${FIELD_BASE} pl-9 pr-10`}
                            />
                            <button
                                type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                                {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </AuthFormField>

                    <AuthFormField label="Confirm password" id="confirmPassword">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock size={14} /></div>
                            <input
                                id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required
                                className={`${FIELD_BASE} pl-9 pr-10`}
                            />
                            <button
                                type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </AuthFormField>

                    {/* Requirements */}
                    <div className="border border-hairline bg-muted/30 px-4 py-3">
                        <p className="eyebrow mb-2">Requirements</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {requirements.map((req) => (
                                <div
                                    key={req.label}
                                    className={`flex items-center gap-2 text-[11px] font-mono ${req.met ? 'text-[hsl(var(--gain))]' : 'text-muted-foreground'}`}
                                >
                                    {req.met ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                                    {req.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <AuthSubmitButton isLoading={loading}>
                        {loading ? 'Updating…' : 'Set New Password'}
                    </AuthSubmitButton>
                </form>
            )}

            {step === 'success' && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--gain))] bg-[hsl(var(--gain)/0.06)] px-4 py-4">
                        <CheckCircle2 size={20} className="text-[hsl(var(--gain))] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="eyebrow text-[hsl(var(--gain))] mb-1">Confirmed</p>
                            <p className="text-[13px] text-foreground leading-snug">
                                Your password is updated. Sign in to continue.
                            </p>
                        </div>
                    </div>

                    <Link href="/login" className="block">
                        <button type="button" className="ed-btn ed-btn-primary w-full h-11">
                            Sign In
                        </button>
                    </Link>
                </div>
            )}
        </AuthPageShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
