// src/app/(main)/brokers/upstox/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI, BROKERS } from '@/lib/api';
import { BROKERS as BROKER_CONFIG } from '@/lib/brokerConfig';
import { Check, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BrokerSetupLayout } from '../_shared/BrokerSetupLayout';

const broker = BROKER_CONFIG.UPSTOX;

export default function UpstoxPage() {
    const { data: syncData } = useBrokerConnection();
    const brokerStatus = syncData?.brokers?.find((b) => b.broker === 'UPSTOX');
    const isConnected = brokerStatus?.tokenActive ?? false;

    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleConnect = async () => {
        setIsConnecting(true);
        setError('');
        try {
            const response = await brokerAPI.getConnectUrl(BROKERS.UPSTOX);
            if (response?.loginUrl) {
                window.location.href = response.loginUrl;
            } else {
                throw new Error('No login URL received');
            }
        } catch (err) {
            setError(err.message || 'Failed to get Upstox login URL');
            setIsConnecting(false);
        }
    };

    const statusBadge = isConnected ? (
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">Connected</span>
    ) : null;

    return (
        <BrokerSetupLayout broker={broker} statusBadge={statusBadge}>
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <AuthAlert type="error" message={error} />

                {isConnected ? (
                    <>
                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <CheckCircle2 size={16} className="text-green-600" />
                            <div>
                                <p className="text-sm font-medium text-green-700">Upstox connected</p>
                                {brokerStatus?.lastSuccessAt && (
                                    <p className="text-xs text-green-700/70 mt-0.5">
                                        Last synced {new Date(brokerStatus.lastSuccessAt).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button onClick={handleConnect} disabled={isConnecting}
                            className="w-full h-9 border border-border text-muted-foreground rounded-lg text-sm hover:bg-accent disabled:opacity-50 transition-colors">
                            {isConnecting ? 'Redirecting...' : 'Reconnect (refresh token)'}
                        </button>

                        <Link href="/portfolio?tab=holdings" className="block text-center text-sm text-blue-600 hover:underline underline-offset-2 mt-3">
                            View portfolio
                        </Link>
                    </>
                ) : (
                    <>
                        <h3 className="text-sm font-semibold text-foreground">Connect your Upstox account</h3>
                        <p className="text-sm text-muted-foreground">
                            You&apos;ll be redirected to Upstox to authorize CoinTrack. No API keys to manage — just log in with your Upstox credentials.
                        </p>

                        <ul className="space-y-2">
                            {broker.capabilities.map((cap) => (
                                <li key={cap} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Check size={13} className="text-green-600" />
                                    {cap}
                                </li>
                            ))}
                        </ul>

                        <button onClick={handleConnect} disabled={isConnecting}
                            className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {isConnecting ? 'Redirecting to Upstox...' : 'Connect via Upstox'}
                        </button>

                        <p className="text-[11px] text-gray-400 text-center">
                            Upstox tokens expire daily. You may need to reconnect each day.
                        </p>
                    </>
                )}
            </div>
        </BrokerSetupLayout>
    );
}
