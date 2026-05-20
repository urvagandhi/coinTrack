// src/app/(access)/verify-email/page.jsx
'use client';

import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { emailAPI } from '@/lib/api';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('loading');
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
        loading: 'Verifying email…',
        success: isChange ? 'Email changed' : 'Email verified',
        already: 'Already verified',
        error: 'Verification failed',
    };

    const subtitles = {
        loading: 'Hold on while we authenticate your link.',
        success: isChange
            ? 'Your email address on file has been updated.'
            : 'Your email is confirmed. Your account is active.',
        already: 'This email address has already been verified previously.',
        error: message,
    };

    return (
        <AuthPageShell
            title={titles[status]}
            subtitle={subtitles[status]}
            index="V"
            kicker="Email Confirmation"
            showFooterLinks={status !== 'loading'}
            asideQuote={'"Each verified entry is a vow kept to the ledger."'}
        >
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-8 h-8 rounded-full border border-hairline border-t-foreground animate-spin" />
                    <p className="eyebrow">Authenticating</p>
                </div>
            )}

            {(status === 'success' || status === 'already') && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--gain))] bg-[hsl(var(--gain)/0.06)] px-4 py-4">
                        {status === 'success'
                            ? <MailCheck size={20} className="text-[hsl(var(--gain))] flex-shrink-0 mt-0.5" />
                            : <CheckCircle2 size={20} className="text-[hsl(var(--gain))] flex-shrink-0 mt-0.5" />
                        }
                        <div>
                            <p className="eyebrow text-[hsl(var(--gain))] mb-1">
                                {status === 'success' ? 'Confirmed' : 'Previously confirmed'}
                            </p>
                            <p className="text-[13px] text-foreground leading-snug">{message}</p>
                        </div>
                    </div>

                    <Link href="/dashboard" className="block">
                        <button type="button" className="ed-btn ed-btn-primary w-full h-11">
                            Go to Dashboard
                        </button>
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.06)] px-4 py-4">
                        <XCircle size={20} className="text-[hsl(var(--loss))] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="eyebrow text-[hsl(var(--loss))] mb-1">Verification failed</p>
                            <p className="text-[13px] text-foreground leading-snug">{message}</p>
                        </div>
                    </div>

                    <Link href="/dashboard" className="block">
                        <button type="button" className="ed-btn ed-btn-ghost w-full h-11">
                            Return to Dashboard
                        </button>
                    </Link>
                </div>
            )}
        </AuthPageShell>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
