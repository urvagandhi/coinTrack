'use client';

import { BrokerStatusBanner } from '@/components/dashboard/BrokerStatusBanner';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary';
import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { useAuth } from '@/contexts/AuthContext';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] || user?.username || 'reader';
    const today = new Date();
    const dateLine = today.toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

    return (
        <div className="space-y-8">
            {/* Editorial masthead — newspaper page-header */}
            <header className="relative pb-6 border-b border-hairline">
                <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="index-num">FOLIO</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            {dateLine}
                        </span>
                    </div>
                    <RefreshButton />
                </div>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <h1 className="display-serif text-[44px] md:text-[64px] text-foreground">
                        {getGreeting()}, <span className="text-[hsl(var(--accent))]">{firstName}</span>.
                    </h1>
                    <p className="text-[13px] text-muted-foreground max-w-sm md:text-right leading-relaxed font-serif italic">
                        All your investments — equities, derivatives, mutuals — laid bare across the page.
                    </p>
                </div>
            </header>

            <BrokerStatusBanner />

            <PortfolioSummary />

            <HoldingsTable />
        </div>
    );
}
