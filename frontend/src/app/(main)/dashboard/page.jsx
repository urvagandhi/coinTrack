// src/app/(main)/dashboard/page.jsx
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
    const firstName = user?.name?.split(' ')[0] || user?.username || 'there';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        All your investments, at a glance.
                    </p>
                </div>
                <RefreshButton />
            </div>

            {/* Broker Status */}
            <BrokerStatusBanner />

            {/* Summary Cards */}
            <PortfolioSummary />

            {/* Holdings */}
            <HoldingsTable />
        </div>
    );
}
