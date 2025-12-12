'use client';

import PageTransition from '@/components/ui/PageTransition';
import { ArrowRight, Link as LinkIcon, ShieldCheck } from 'lucide-react';

const BrokerCard = ({ name, description, color, connected = false }) => (
    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 flex flex-col items-start transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg`}>
            {name[0]}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 min-h-[40px]">{description}</p>

        <button className={`
            w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
            ${connected
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 cursor-default'
                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 active:scale-95'
            }
        `}>
            {connected ? (
                <>
                    <ShieldCheck className="w-4 h-4" />
                    Connected
                </>
            ) : (
                <>
                    Connect
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </button>
    </div>
);

export default function BrokersPage() {
    // Mock Data
    const brokers = [
        { name: 'Zerodha', description: "India's largest stock broker. Offers free equity investments.", color: 'from-blue-500 to-blue-600', connected: true },
        { name: 'Upstox', description: 'Low cost trading platform with advanced charts.', color: 'from-purple-500 to-purple-600', connected: false },
        { name: 'Angel One', description: 'Full-service retail broker combining tech and advisory.', color: 'from-orange-500 to-red-500', connected: false },
        { name: 'Groww', description: 'Simple investing for stocks and mutual funds.', color: 'from-teal-400 to-emerald-500', connected: false },
        { name: '5Paisa', description: 'Flat fee discount brokerage for traders.', color: 'from-orange-400 to-orange-600', connected: false },
    ];

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
                        <BrokerCard key={broker.name} {...broker} />
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
            </div>
        </PageTransition>
    );
}
