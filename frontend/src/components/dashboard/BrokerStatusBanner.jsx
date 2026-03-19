// src/components/dashboard/BrokerStatusBanner.jsx
'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI } from '@/lib/api';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

const BROKER_NAMES = { ZERODHA: 'Zerodha', ANGEL_ONE: 'Angel One', UPSTOX: 'Upstox' };
const BROKER_COLORS = {
    ZERODHA: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    ANGEL_ONE: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    UPSTOX: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

export function BrokerStatusBanner() {
    const { data: syncData } = useBrokerConnection();
    const [dismissed, setDismissed] = useState([]);

    const brokers = syncData?.brokers ?? [];
    if (!brokers.length) return null;

    const alerts = brokers.filter(
        (b) => !dismissed.includes(b.broker) && !b.tokenActive && b.lastStatus !== null && b.lastStatus !== 'NEVER_SYNCED'
    );

    const handleReconnect = async (brokerName) => {
        try {
            const response = await brokerAPI.getConnectUrl(brokerName);
            if (response?.loginUrl) {
                window.location.href = response.loginUrl;
            }
        } catch (error) {
            console.error('Failed to get connect URL', error);
        }
    };

    // Active broker pills
    if (alerts.length === 0) {
        const activeBrokers = brokers.filter(b => b.tokenActive);
        if (activeBrokers.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2">
                {activeBrokers.map(b => {
                    const lastSync = b.lastSuccessAt
                        ? (() => {
                            const m = Math.floor((Date.now() - new Date(b.lastSuccessAt).getTime()) / 60000);
                            if (m < 1) return 'just now';
                            if (m < 60) return `${m}m ago`;
                            const h = Math.floor(m / 60);
                            if (h < 24) return `${h}h ago`;
                            return `${Math.floor(h / 24)}d ago`;
                        })()
                        : null;

                    const colors = BROKER_COLORS[b.broker] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';

                    return (
                        <div key={b.broker} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${colors}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {BROKER_NAMES[b.broker] || b.broker}
                            {lastSync && <span className="opacity-60">· {lastSync}</span>}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Expired alerts
    return (
        <div className="space-y-2">
            {alerts.map((alert) => (
                <div
                    key={alert.broker}
                    className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-lg text-sm"
                >
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle size={16} />
                        <span>
                            <span className="font-semibold">{BROKER_NAMES[alert.broker] || alert.broker}</span> session expired. Reconnect to resume sync.
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleReconnect(alert.broker)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                        >
                            Reconnect
                        </button>
                        <button
                            onClick={() => setDismissed(prev => [...prev, alert.broker])}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
