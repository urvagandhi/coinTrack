// src/app/(main)/brokers/page.jsx
'use client';

import { BrokerCard } from './_shared/BrokerCard';
import { BROKER_LIST } from '@/lib/brokerConfig';
import { containerVariants, pageVariants, useMotionVariants } from '@/lib/motion';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function BrokersPage() {
    const pageV = useMotionVariants(pageVariants);
    const container = useMotionVariants(containerVariants);

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold text-foreground">Broker Integrations</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Connect your brokerage accounts to sync holdings, positions, and funds automatically.
                </p>
            </div>

            <motion.div variants={container} initial="hidden" animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {BROKER_LIST.map((broker) => (
                    <BrokerCard key={broker.id} broker={broker} />
                ))}
            </motion.div>

            <div className="flex items-start gap-3 p-4 bg-accent border border-border rounded-xl">
                <ShieldCheck size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-foreground">Your credentials are encrypted</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        API keys are encrypted with AES-256-GCM before storage. CoinTrack only reads your portfolio data — it cannot place orders on your behalf.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
