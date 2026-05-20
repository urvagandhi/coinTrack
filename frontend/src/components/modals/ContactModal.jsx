'use client';

import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { contactAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, Mail, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

function useNow() {
    const [now, setNow] = useState(null);
    useEffect(() => { setNow(new Date()); }, []);
    return now;
}

const FIELD_BASE =
    'w-full h-11 px-3 font-mono text-[13px] bg-background border border-hairline ' +
    'focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground ' +
    'transition-colors placeholder:text-muted-foreground/60';

const TEXTAREA_BASE =
    'w-full px-3 py-2.5 font-mono text-[13px] bg-background border border-hairline ' +
    'focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground ' +
    'transition-colors placeholder:text-muted-foreground/60 resize-none leading-relaxed';

export default function ContactModal() {
    const { activeModal, closeModal } = useModal();
    const { toast } = useToast();
    const { user } = useAuth();
    const now = useNow();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: user?.name || user?.username || '',
            email: user?.email || '',
            message: ''
        }
    });

    const dateString = now ? now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }) : '';
    const refNo = now ? `LTR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}` : 'LTR-—';

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await contactAPI.sendMessage(data);
            toast({
                title: 'Dispatch received',
                description: "We've logged your letter and will reply by return post.",
                variant: 'success',
            });
            reset();
            closeModal();
        } catch (error) {
            toast({
                title: 'Dispatch failed',
                description: error.message || 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (activeModal !== 'contact') return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    onClick={closeModal}
                />

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-xl bg-background border border-hairline shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
                >
                    {/* Masthead */}
                    <div className="border-b border-hairline px-6 sm:px-8 pt-5 pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-3 mb-2">
                                    <span className="index-num tnum text-[11px]">[ §IV ]</span>
                                    <span className="eyebrow">Letters · To the Editor</span>
                                </div>
                                <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.05] tracking-tight text-foreground flex items-baseline gap-3">
                                    <Mail size={20} className="text-[hsl(var(--accent))] translate-y-0.5" aria-hidden="true" />
                                    <span>Contact the Desk</span>
                                </h3>
                                <p className="mt-2 font-serif italic text-[15px] text-muted-foreground leading-snug">
                                    A short note finds us quickest. We read every letter and reply, typically within a working day.
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                aria-label="Close"
                                className="flex-shrink-0 p-1.5 border border-hairline hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-4 rule-strong-h" />

                        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[11px]">
                            <p className="eyebrow">Reference · <span className="font-mono text-foreground normal-case tracking-normal" suppressHydrationWarning>{refNo}</span></p>
                            <p className="font-mono text-muted-foreground" suppressHydrationWarning>
                                Dated · {dateString || '—'}
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 sm:px-8 py-6 space-y-5 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="contact-name" className="eyebrow-strong block">
                                    Signed
                                </label>
                                <input
                                    id="contact-name"
                                    {...register('name', { required: 'Required' })}
                                    className={FIELD_BASE}
                                    placeholder="Your full name"
                                    autoComplete="name"
                                />
                                {errors.name && (
                                    <p className="flex items-center gap-1.5 text-[11px] font-mono text-[hsl(var(--loss))]">
                                        <AlertCircle size={11} />
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="contact-email" className="eyebrow-strong block">
                                    Return address
                                </label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    {...register('email', {
                                        required: 'Required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid address',
                                        },
                                    })}
                                    className={FIELD_BASE}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                                {errors.email && (
                                    <p className="flex items-center gap-1.5 text-[11px] font-mono text-[hsl(var(--loss))]">
                                        <AlertCircle size={11} />
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="contact-message" className="eyebrow-strong block">
                                The letter
                            </label>
                            <textarea
                                id="contact-message"
                                rows={6}
                                {...register('message', {
                                    required: 'A few words, please',
                                    minLength: { value: 10, message: 'A little more — at least ten characters' },
                                })}
                                className={TEXTAREA_BASE}
                                placeholder="Write to the editor — feedback, a question, a complaint, a kind word…"
                            />
                            {errors.message && (
                                <p className="flex items-center gap-1.5 text-[11px] font-mono text-[hsl(var(--loss))]">
                                    <AlertCircle size={11} />
                                    {errors.message.message}
                                </p>
                            )}
                            <p className="text-[11px] font-mono text-muted-foreground">
                                Sent over TLS · stored only as long as needed to reply.
                            </p>
                        </div>

                        <div className="border-l-2 border-foreground/70 pl-4 py-1">
                            <p className="font-serif italic text-[14px] text-muted-foreground leading-snug">
                                Or write directly to <span className="font-mono not-italic text-foreground">support@cointrack.app</span>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-primary w-full h-11 px-5 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Dispatching…
                                </>
                            ) : (
                                <>
                                    <Send size={14} />
                                    Send Dispatch
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-hairline px-6 sm:px-8 py-3 flex items-center justify-between gap-4">
                        <p className="eyebrow">&copy; CoinTrack — Letters Desk</p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                            Mon–Fri · 09:00–18:00 IST
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
