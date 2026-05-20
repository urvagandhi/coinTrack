'use client';

import { useModal } from '@/contexts/ModalContext';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Lock, Cookie, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function useNow() {
    const [now, setNow] = useState(null);
    useEffect(() => { setNow(new Date()); }, []);
    return now;
}

const LEGAL = {
    privacy: {
        index: '§I',
        kicker: 'The Charter · Privacy',
        title: 'Privacy Policy',
        lede: 'On the gathering, keeping, and quiet stewardship of your personal record.',
        icon: Lock,
        revision: 'Rev. 04 · Folio P-001',
        sections: [
            {
                tag: '§ A',
                heading: 'What we collect',
                body: 'We gather only what is necessary to operate your account: identity (name, email, date of birth), credentials in hashed form, the broker connections you authorise, and the device markers your browser supplies on each visit.',
            },
            {
                tag: '§ B',
                heading: 'How we use it',
                body: 'Your record is consulted to maintain your session, present your holdings, calculate returns, and dispatch transactional notices. We do not auction your data, nor do we lend it to third parties for marketing.',
            },
            {
                tag: '§ C',
                heading: 'How we guard it',
                body: 'Sensitive material is encrypted at rest, transit is TLS-secured, and access is audited. Multi-factor authentication is mandatory on every account — a standing precaution, not an opt-in.',
            },
            {
                tag: '§ D',
                heading: 'Your rights',
                body: 'You may request a transcript of your record, ask for corrections, or close the ledger entirely. Write to the editor at privacy@cointrack.app and we will respond within seven working days.',
            },
        ],
    },
    terms: {
        index: '§II',
        kicker: 'The Charter · Conditions',
        title: 'Terms of Service',
        lede: 'A plain reading of the arrangement between coinTrack and its subscribers.',
        icon: FileText,
        revision: 'Rev. 04 · Folio T-001',
        sections: [
            {
                tag: '§ A',
                heading: 'Subscription',
                body: 'By opening an account you agree to these terms in their current form. We may revise them; material changes are posted to your dashboard and emailed at least fourteen days in advance.',
            },
            {
                tag: '§ B',
                heading: 'Your account',
                body: 'You are the sole custodian of your credentials. Activity conducted under your sign-in is presumed to be yours. Lost or compromised access must be reported without delay.',
            },
            {
                tag: '§ C',
                heading: 'Permitted use',
                body: 'coinTrack is offered for personal portfolio management. Resale, scraping, automated extraction, or use that disrupts the service is forbidden. Broker integrations remain bound by each broker’s own conditions.',
            },
            {
                tag: '§ D',
                heading: 'Limits of liability',
                body: 'Figures shown are for reference; we are not your broker, advisor, or fiduciary. Trading decisions rest with you. coinTrack accepts no liability for losses arising from market movement or from third-party data sources.',
            },
        ],
    },
    cookies: {
        index: '§III',
        kicker: 'The Charter · Cookies',
        title: 'Cookie Policy',
        lede: 'A short essay on the small markers your browser keeps on our behalf.',
        icon: Cookie,
        revision: 'Rev. 04 · Folio C-001',
        sections: [
            {
                tag: '§ A',
                heading: 'What they are',
                body: 'Cookies are modest text files set on your device when you visit. They allow a site to recognise the same browser on a return visit and to keep your session intact while you move between pages.',
            },
            {
                tag: '§ B',
                heading: 'Strictly necessary',
                body: 'A small number of cookies are required for sign-in, session integrity, and cross-site request defence. These cannot be disabled without breaking the service.',
            },
            {
                tag: '§ C',
                heading: 'Measurement',
                body: 'We may set aggregated, anonymised cookies to understand which pages are read and where the broker flow stumbles. No identifying material is sold or surrendered to advertisers.',
            },
            {
                tag: '§ D',
                heading: 'Your control',
                body: 'Most browsers allow you to clear cookies or refuse new ones. Doing so will sign you out and reset your preferences; the service will otherwise continue to function.',
            },
        ],
    },
};

export default function LegalModals() {
    const { activeModal, closeModal } = useModal();
    const now = useNow();
    const data = LEGAL[activeModal];

    const dateString = now ? now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }) : '';

    if (!data) return null;
    const Icon = data.icon;

    return (
        <AnimatePresence>
            {activeModal && (
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
                        className="relative w-full max-w-2xl bg-background border border-hairline shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Masthead */}
                        <div className="border-b border-hairline px-6 sm:px-8 pt-5 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="index-num tnum text-[11px]">[ {data.index} ]</span>
                                        <span className="eyebrow">{data.kicker}</span>
                                    </div>
                                    <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.05] tracking-tight text-foreground flex items-baseline gap-3">
                                        <Icon size={20} className="text-[hsl(var(--accent))] translate-y-0.5" aria-hidden="true" />
                                        <span>{data.title}</span>
                                    </h3>
                                    <p className="mt-2 font-serif italic text-[15px] text-muted-foreground leading-snug">
                                        {data.lede}
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
                                <p className="eyebrow">{data.revision}</p>
                                <p className="font-mono text-muted-foreground" suppressHydrationWarning>
                                    Issued · {dateString || '—'}
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 sm:px-8 py-6 overflow-y-auto">
                            <ol className="space-y-6">
                                {data.sections.map((s) => (
                                    <li key={s.tag} className="grid grid-cols-[auto_1fr] gap-x-4">
                                        <span className="display-num text-[11px] text-[hsl(var(--accent))] pt-1">{s.tag}</span>
                                        <div>
                                            <h4 className="font-serif text-[18px] text-foreground leading-snug">
                                                {s.heading}
                                            </h4>
                                            <p className="mt-1.5 text-[14px] text-muted-foreground leading-relaxed">
                                                {s.body}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>

                            <div className="mt-8 border-l-2 border-foreground/70 pl-5">
                                <p className="font-serif italic text-[15px] text-foreground leading-snug">
                                    Questions of conscience, conflict, or correction may be sent to the editor.
                                </p>
                                <p className="mt-1 eyebrow">
                                    legal@cointrack.app
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-hairline px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
                            <p className="eyebrow">&copy; CoinTrack — The Charter</p>
                            <button
                                onClick={closeModal}
                                className="ed-btn ed-btn-primary h-10 px-5"
                            >
                                Understood
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
