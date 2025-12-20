'use client';

import BrokerStatusBanner from '@/components/dashboard/BrokerStatusBanner';
import HoldingsTable from '@/components/dashboard/HoldingsTable';
import PortfolioSummary from '@/components/dashboard/PortfolioSummary';
import RefreshButton from '@/components/dashboard/RefreshButton';
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function DashboardPage() {
    const { data: brokers } = useBrokerConnection();
    const { toast } = useToast();
    const router = useRouter();
    const toastShownRef = useRef(false);

    useEffect(() => {
        // Only show toast once per session
        if (toastShownRef.current || !brokers) return;

        // Check for expired or disconnected brokers
        const expiredBrokers = brokers.filter(
            (b) => b.status === 'EXPIRED' || b.status === 'DISCONNECTED' || b.isTokenExpired
        );

        const notConnectedBrokers = brokers.filter(
            (b) => !b.connected && b.hasCredentials
        );

        // Check if any broker needs attention
        if (expiredBrokers.length > 0) {
            toastShownRef.current = true;
            const brokerNames = expiredBrokers.map(b => b.broker).join(', ');
            toast({
                title: "⚠️ Session Expired",
                description: `Your ${brokerNames} session has expired. Zerodha sessions reset daily at 6 AM. Please reconnect to continue syncing.`,
                variant: "warning",
                duration: 10000,
                action: (
                    <ToastAction
                        altText="Connect Broker"
                        onClick={() => router.push('/brokers')}
                        className="border-amber-500 hover:bg-amber-500 hover:text-white dark:border-amber-500"
                    >
                        Connect
                    </ToastAction>
                ),
            });
        } else if (notConnectedBrokers.length > 0 || brokers.every(b => !b.connected)) {
            // Check if user has credentials but not connected, or no broker connected at all
            const hasAnyCredentials = brokers.some(b => b.hasCredentials);
            if (!hasAnyCredentials || notConnectedBrokers.length > 0) {
                toastShownRef.current = true;
                toast({
                    title: "🔗 Connect Your Broker",
                    description: "Connect your trading account to start tracking your portfolio in real-time.",
                    variant: "default",
                    duration: 8000,
                    action: (
                        <ToastAction
                            altText="Setup Broker"
                            onClick={() => router.push('/brokers')}
                        >
                            Setup
                        </ToastAction>
                    ),
                });
            }
        }
    }, [brokers, toast, router]);

    return (
        <div className="min-h-screen bg-background text-foreground p-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Portfolio
                        </h1>
                        <p className="text-gray-500 mt-1">Track your net worth and performance.</p>
                    </div>
                    <RefreshButton />
                </div>

                {/* Broker Status */}
                <BrokerStatusBanner />

                {/* Summary Cards */}
                <PortfolioSummary />

                {/* Holdings */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-black-200">Holdings</h2>
                    <HoldingsTable />
                </section>

            </div>
        </div>
    );
}
