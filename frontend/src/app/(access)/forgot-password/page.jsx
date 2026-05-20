// src/app/(access)/forgot-password/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { passwordAPI } from '@/lib/api';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const FIELD_BASE =
    'w-full h-11 px-3 bg-transparent border border-hairline text-foreground text-[14px] ' +
    'focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))] ' +
    'transition-colors placeholder:text-muted-foreground/60 disabled:opacity-60';

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

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

    const title = submitted ? 'Dispatch confirmed' : 'Reset password';
    const subtitle = submitted
        ? undefined
        : 'Enter your email, username, or phone number — we will send a reset link.';

    return (
        <AuthPageShell
            title={title}
            subtitle={subtitle}
            index="III"
            kicker="Account Recovery"
            asideQuote={'"Lost passwords are footnotes — they require care, but never alarm."'}
        >
            {!submitted ? (
                <>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AuthAlert type="error" message={error} />

                        <AuthFormField label="Email · Username · Phone" id="identifier" hint="Whichever you used to register.">
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Mail size={14} />
                                </div>
                                <input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="reader@cointrack.app"
                                    disabled={loading}
                                    className={`${FIELD_BASE} pl-9`}
                                />
                            </div>
                        </AuthFormField>

                        <AuthSubmitButton isLoading={loading}>
                            {loading ? 'Sending…' : 'Send Reset Link'}
                        </AuthSubmitButton>
                    </form>

                    <div className="mt-8 pt-6 border-t border-hairline text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={12} />
                            Back to sign in
                        </Link>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--gain))] bg-[hsl(var(--gain)/0.06)] px-4 py-4">
                        <MailCheck size={20} className="text-[hsl(var(--gain))] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="eyebrow text-[hsl(var(--gain))] mb-1">Dispatched</p>
                            <p className="text-[13px] text-foreground leading-snug">
                                If an account exists for <span className="font-mono text-foreground">{identifier}</span>,
                                a reset link is on its way.
                            </p>
                        </div>
                    </div>

                    <div className="border border-hairline bg-muted/30 px-4 py-3">
                        <p className="eyebrow mb-1">Footnote</p>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                            Check your spam folder if it doesn&apos;t arrive within a few minutes.
                            The link expires in <span className="font-mono text-foreground">10 minutes</span>.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => { setSubmitted(false); setIdentifier(''); }}
                            className="ed-btn ed-btn-ghost flex-1 h-11"
                        >
                            Try Different Identifier
                        </button>
                        <Link href="/login" className="flex-1">
                            <button type="button" className="ed-btn ed-btn-primary w-full h-11">
                                Return to Sign In
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </AuthPageShell>
    );
}
