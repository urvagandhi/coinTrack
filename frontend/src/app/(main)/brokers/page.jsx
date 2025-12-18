'use client';

import ConnectBrokerDialog from '@/components/brokers/ConnectBrokerDialog';
import PageTransition from '@/components/ui/PageTransition';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import api from '@/lib/api';
import { ArrowRight, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const BrokerCard = ({ name, description, color, connected = false, onConnect, disabled, comingSoon = false }) => (
    <div className={`bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 flex flex-col items-start transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${comingSoon ? 'opacity-75' : ''}`}>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg`}>
            {name[0]}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 min-h-[40px]">{description}</p>

        {comingSoon ? (
            <div className="w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span className="text-lg">🚀</span>
                Coming Soon
            </div>
        ) : (
            <button
                onClick={!connected ? onConnect : undefined}
                disabled={disabled || connected}
                className={`
                w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                ${connected
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 cursor-default'
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 active:scale-95 disabled:opacity-50'
                    }
            `}>
                {connected ? (
                    <>
                        <ShieldCheck className="w-4 h-4" />
                        Connected
                    </>
                ) : (
                    <>
                        {disabled ? 'Loading...' : 'Connect'}
                        {!disabled && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </>
                )}
            </button>
        )}
    </div>
);


export default function BrokersPage() {
    const { data: brokersStatus, isLoading } = useBrokerConnection();
    const [isConnecting, setIsConnecting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState(null);

    const handleConnectClick = (brokerId) => {
        const status = brokersStatus?.find(s => s.broker === brokerId);

        // If Broker is Zerodha and NO credentials set, open dialog
        if (brokerId === 'ZERODHA' && !status?.hasCredentials) {
            setSelectedBroker(brokerId);
            setDialogOpen(true);
        } else {
            // Already configured or other broker -> Direct Connect
            handleConnectDirect(brokerId);
        }
    };

    const handleDialogSubmit = async (credentials) => {
        setIsConnecting(true);
        try {
            // 1. Save credentials
            if (selectedBroker === 'ZERODHA') {
                await api.post(`/api/brokers/zerodha/credentials`, {
                    apiKey: credentials.zerodhaApiKey,
                    apiSecret: credentials.zerodhaApiSecret
                });

                // 2. Connect (Get Login URL)
                handleConnectDirect('ZERODHA');
            } else {
                // Fallback for others if needed
                const { data } = await api.post(`/api/brokers/${selectedBroker}/connect`, credentials);
                if (data.loginUrl) {
                    window.location.href = data.loginUrl;
                }
            }
        } catch (error) {
            // Optional: logger.error via generic error boundary or just state
            // console.error("Failed to connect", error);
            // Optional: Show toast error
            setIsConnecting(false);
        } finally {
            if (selectedBroker !== 'ZERODHA') {
                setIsConnecting(false);
            }
            setDialogOpen(false);
        }
    };

    const handleConnectDirect = async (brokerId) => {
        setIsConnecting(true);
        try {
            const { data } = await api.get(`/api/brokers/${brokerId}/connect`);
            if (data.loginUrl) {
                window.location.href = data.loginUrl;
            }
        } catch (error) {
            // console.error("Failed to get login URL", error);
        } finally {
            setIsConnecting(false);
        }
    };

    // Merge status with static descriptions
    // Only Zerodha is available for connection, others are Coming Soon
    const brokers = [
        { name: 'Zerodha', description: "India's largest stock broker. Offers free equity investments.", color: 'from-blue-500 to-blue-600', id: 'ZERODHA', comingSoon: false },
        { name: 'Upstox', description: 'Low cost trading platform with advanced charts.', color: 'from-purple-500 to-purple-600', id: 'UPSTOX', comingSoon: true },
        { name: 'Angel One', description: 'Full-service retail broker combining tech and advisory.', color: 'from-orange-500 to-red-500', id: 'ANGELONE', comingSoon: true },
        { name: 'Groww', description: 'Simple investing for stocks and mutual funds.', color: 'from-teal-400 to-emerald-500', id: 'GROWW', comingSoon: true },
        { name: '5Paisa', description: 'Flat fee discount brokerage for traders.', color: 'from-orange-400 to-orange-600', id: 'FYERS', comingSoon: true },
    ].map(b => {
        const status = brokersStatus?.find(s => s.broker === b.id);
        const connected = status?.connectionStatus === 'CONNECTED';
        // Check for expiry: status.isTokenExpired might be true
        return { ...b, connected, hasCredentials: status?.hasCredentials };
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                                <LinkIcon className="w-6 h-6" />
                            </span>
                            Broker Integrations
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Connect your brokerage accounts to automatically sync your portfolio.
                        </p>
                    </div>
                </div>

                {/* Brokers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {brokers.map((broker) => (
                        <BrokerCard
                            key={broker.name}
                            {...broker}
                            onConnect={() => handleConnectClick(broker.id)}
                            disabled={isConnecting}
                        />
                    ))}

                    {/* "Coming Soon" Card */}
                    <div className="bg-gray-50/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-3">
                            <span className="text-2xl font-bold text-gray-400">?</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">More Coming Soon</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We are adding new brokers every week.</p>
                    </div>
                </div>

                <ConnectBrokerDialog
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSubmit={handleDialogSubmit}
                    isConnecting={isConnecting}
                />
            </div>
        </PageTransition>
    );
}
