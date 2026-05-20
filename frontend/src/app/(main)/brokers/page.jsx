'use client';

import { BROKER_LIST } from '@/lib/brokerConfig';
import { ShieldCheck } from 'lucide-react';
import { BrokerCard } from './_shared/BrokerCard';

export default function BrokersPage() {
    return (
        <div className="space-y-10">
            <header className="pb-6 border-b border-hairline">
                <div className="flex items-center gap-3 mb-5">
                    <span className="index-num">FOLIO·§03</span>
                    <span className="h-px w-8 bg-hairline" />
                    <span className="eyebrow">Vendor Directory</span>
                </div>
                <h1 className="display-serif text-[40px] md:text-[56px] text-foreground mb-3">
                    Broker <span className="italic text-[hsl(var(--accent))]">Integrations</span>
                </h1>
                <p className="font-serif italic text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
                    Authorise your brokerage accounts to syndicate holdings, positions, and funds. CoinTrack reads only — it cannot trade on your behalf.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 stagger-fade">
                {BROKER_LIST.map((broker, i) => (
                    <BrokerCard key={broker.id} broker={broker} index={i} />
                ))}
            </div>

            <div className="ed-card relative px-6 py-5 flex items-start gap-4 mt-2">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                <div className="h-10 w-10 flex items-center justify-center rounded-sm bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30 flex-shrink-0">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--accent))]" strokeWidth={2} />
                </div>
                <div>
                    <p className="eyebrow-strong mb-1.5">Notice on Security</p>
                    <p className="text-[12px] text-muted-foreground font-serif italic leading-relaxed">
                        Credentials are encrypted with AES-256-GCM before storage. CoinTrack reads portfolio data only — placement, modification, or cancellation of orders is impossible by design.
                    </p>
                </div>
            </div>
        </div>
    );
}
