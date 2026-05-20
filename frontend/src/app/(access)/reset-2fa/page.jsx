// src/app/(access)/reset-2fa/page.jsx
'use client';

import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { twofaAPI } from '@/lib/api';
import { ShieldOff, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function Reset2FAContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState('verifying');
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
        verifying: 'Processing recovery…',
        success: '2FA disabled',
        error: 'Recovery failed',
    };

    const subtitles = {
        verifying: 'Hold on while we process your recovery request.',
        success: 'Two-factor authentication has been removed from your account.',
        error: message,
    };

    return (
        <AuthPageShell
            title={titles[step]}
            subtitle={subtitles[step]}
            index="VI"
            kicker="2FA Recovery"
            showFooterLinks={step !== 'verifying'}
            asideQuote={'"Security restored is a quiet kind of relief."'}
        >
            {step === 'verifying' && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-8 h-8 rounded-full border border-hairline border-t-foreground animate-spin" />
                    <p className="eyebrow">Disabling 2FA</p>
                </div>
            )}

            {step === 'success' && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/0.08)] px-4 py-4">
                        <ShieldOff size={20} className="text-[hsl(var(--chart-4))] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="eyebrow text-[hsl(var(--chart-4))] mb-1">Account less secure</p>
                            <p className="text-[13px] text-foreground leading-snug">
                                You will be required to set up two-factor authentication on your next sign in.
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

            {step === 'error' && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.06)] px-4 py-4">
                        <XCircle size={20} className="text-[hsl(var(--loss))] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="eyebrow text-[hsl(var(--loss))] mb-1">Recovery failed</p>
                            <p className="text-[13px] text-foreground leading-snug">{message}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <a href="mailto:support@cointrack.app" className="flex-1">
                            <button type="button" className="ed-btn ed-btn-info w-full h-11">
                                Contact Support
                            </button>
                        </a>
                        <Link href="/login" className="flex-1">
                            <button type="button" className="ed-btn ed-btn-ghost w-full h-11">
                                Return to Sign In
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </AuthPageShell>
    );
}

export default function Reset2FAPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin" />
            </div>
        }>
            <Reset2FAContent />
        </Suspense>
    );
}
