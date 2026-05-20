'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI } from '@/lib/api';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

const BROKER_NAMES = { ZERODHA: 'Zerodha', ANGEL_ONE: 'Angel One', UPSTOX: 'Upstox' };
const BROKER_VARS = {
    ZERODHA:   'hsl(var(--broker-zerodha))',
    ANGEL_ONE: 'hsl(var(--broker-angel))',
    UPSTOX:    'hsl(var(--broker-upstox))',
};

function relativeTime(iso) {
    if (!iso) return null;
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

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
            if (response?.loginUrl) window.location.href = response.loginUrl;
        } catch (error) { console.error('Failed to get connect URL', error); }
    };

    if (alerts.length === 0) {
        const active = brokers.filter(b => b.tokenActive);
        if (active.length === 0) return null;
        return (
            <div className="ed-card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
                <span className="eyebrow-strong">Live Feeds</span>
                <span className="h-3 w-px bg-border" />
                {active.map(b => {
                    const last = relativeTime(b.lastSuccessAt);
                    return (
                        <div key={b.broker} className="flex items-center gap-2 text-[12px]">
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: BROKER_VARS[b.broker] }}
                            />
                            <span className="font-medium text-foreground">{BROKER_NAMES[b.broker] || b.broker}</span>
                            {last && (
                                <span className="text-muted-foreground tnum font-mono text-[11px]">· {last}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {alerts.map((alert) => (
                <div
                    key={alert.broker}
                    className="relative flex items-center justify-between gap-4 px-5 py-3 ed-card"
                    style={{ borderLeft: `3px solid hsl(var(--loss))` }}
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-[hsl(var(--loss))]" strokeWidth={2} />
                        <div>
                            <p className="text-[11px] eyebrow text-[hsl(var(--loss))]">Session Expired</p>
                            <p className="text-[13px] text-foreground mt-0.5">
                                <span className="font-semibold">{BROKER_NAMES[alert.broker] || alert.broker}</span>
                                {' — reconnect to resume sync.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleReconnect(alert.broker)}
                            className="ed-btn ed-btn-primary"
                        >
                            Reconnect
                        </button>
                        <button
                            onClick={() => setDismissed(prev => [...prev, alert.broker])}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
