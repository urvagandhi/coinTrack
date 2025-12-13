'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { AnimatePresence, motion } from 'framer-motion';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import X from 'lucide-react/dist/esm/icons/x'; // Assuming lucide-react is installed per package.json
import { useState } from 'react';

export default function BrokerStatusBanner() {
    const { data: brokers } = useBrokerConnection();
    const [dismissed, setDismissed] = useState([]);

    if (!brokers) return null;

    const handleDismiss = (brokerName) => {
        setDismissed((prev) => [...prev, brokerName]);
    };

    const getReconnectUrl = (broker) => {
        // Stub URL, backend likely provides this or it's a standard frontend route
        return `/api/brokers/${broker}/reconnect-url`;
    };

    // Filter for compromised accounts
    const alerts = brokers.filter(
        (b) =>
            !dismissed.includes(b.broker) &&
            (b.status === 'EXPIRED' || b.status === 'DISCONNECTED' || b.isTokenExpired)
    );

    return (
        <div className="space-y-2 mb-4">
            <AnimatePresence>
                {alerts.map((alert) => (
                    <motion.div
                        key={alert.broker}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-center justify-between text-red-200"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span>
                                <span className="font-bold">{alert.broker}</span> session expired. Please reconnect to resume sync.
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={getReconnectUrl(alert.broker)} // This would likely be an API call to get the URL ideally
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md transition-colors"
                            >
                                Reconnect
                            </a>
                            <button
                                onClick={() => handleDismiss(alert.broker)}
                                className="p-1 hover:bg-red-800/50 rounded-full"
                                aria-label="Dismiss"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
