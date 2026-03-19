// src/app/(main)/brokers/_shared/BrokerSetupLayout.jsx
'use client';

import { pageVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import Link from 'next/link';

function SetupStep({ number, step }) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                {number}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                {step.code && (
                    <code className="block mt-2 px-3 py-2 bg-accent border border-border rounded-lg text-xs font-mono text-foreground break-all select-all">
                        {step.code}
                    </code>
                )}
                {step.link && (
                    <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:underline underline-offset-2">
                        {step.link.label}
                        <ExternalLink size={11} />
                    </a>
                )}
            </div>
        </div>
    );
}

export function BrokerSetupLayout({ broker, children, statusBadge }) {
    const pageV = useMotionVariants(pageVariants);

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" className="max-w-4xl">
            <Link href="/brokers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                <ArrowLeft size={15} />
                Back to Brokers
            </Link>

            <div className="flex items-center gap-3 mb-8">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold', broker.badgeClass)}>
                    {broker.initials}
                </div>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold text-foreground">Connect {broker.displayName}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{broker.tagline}</p>
                </div>
                {statusBadge}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                <div className="space-y-6">
                    <h2 className="text-sm font-semibold text-foreground">How to connect</h2>
                    {broker.setupSteps.map((step, i) => (
                        <SetupStep key={i} number={i + 1} step={step} />
                    ))}

                    <div className="flex items-start gap-3 p-4 bg-accent border border-border rounded-xl">
                        <Lock size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Your credentials are encrypted with AES-256-GCM before being stored. CoinTrack reads portfolio data only — it cannot place or cancel orders on your behalf.
                        </p>
                    </div>
                </div>

                <div className="lg:sticky lg:top-20 h-fit">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}
