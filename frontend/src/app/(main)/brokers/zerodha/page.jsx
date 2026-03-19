// src/app/(main)/brokers/zerodha/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI, BROKERS } from '@/lib/api';
import { BROKERS as BROKER_CONFIG } from '@/lib/brokerConfig';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrokerSetupLayout } from '../_shared/BrokerSetupLayout';
import { CredentialField } from '../_shared/CredentialField';

const broker = BROKER_CONFIG.ZERODHA;

export default function ZerodhaPage() {
    const { data: syncData } = useBrokerConnection();
    const brokerStatus = syncData?.brokers?.find((b) => b.broker === 'ZERODHA');
    const isConnected = brokerStatus?.tokenActive ?? false;

    const [form, setForm] = useState({ apiKey: '', apiSecret: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [error, setError] = useState('');

    // If a broker account exists in DB, credentials were already saved previously
    useEffect(() => {
        if (brokerStatus && !credentialsSaved) {
            setCredentialsSaved(true);
        }
    }, [brokerStatus]);

    const handleSaveCredentials = async () => {
        if (!form.apiKey.trim() || !form.apiSecret.trim()) return;
        setIsSaving(true);
        setError('');
        try {
            await brokerAPI.saveZerodhaCredentials({ apiKey: form.apiKey, apiSecret: form.apiSecret });
            setCredentialsSaved(true);
            // Auto-redirect to Zerodha OAuth
            await handleConnect();
        } catch (err) {
            setError(err.message || 'Failed to save credentials');
            setIsSaving(false);
        }
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setError('');
        try {
            const response = await brokerAPI.getConnectUrl(BROKERS.ZERODHA);
            if (response?.loginUrl) {
                window.location.href = response.loginUrl;
            } else {
                throw new Error('No login URL received');
            }
        } catch (err) {
            setError(err.message || 'Failed to get login URL');
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
                    /* Connected state */
                    <>
                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <CheckCircle2 size={16} className="text-green-600" />
                            <div>
                                <p className="text-sm font-medium text-green-700">Zerodha connected</p>
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
                ) : credentialsSaved ? (
                    /* Credentials saved — show connect button */
                    <>
                        <h3 className="text-sm font-semibold text-foreground">Credentials saved</h3>
                        {broker.credentialFields.map((field) => (
                            <CredentialField key={field.key} field={field} value={form[field.key]} onChange={() => {}}
                                isSaved onEdit={() => setCredentialsSaved(false)} />
                        ))}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Authorize with Zerodha</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Click below to be redirected to Zerodha Kite for authorization.
                            </p>
                            <button onClick={handleConnect} disabled={isConnecting}
                                className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                {isConnecting ? 'Redirecting to Zerodha...' : 'Connect via Zerodha Kite'}
                            </button>
                        </div>
                    </>
                ) : (
                    /* Credential entry form */
                    <>
                        <h3 className="text-sm font-semibold text-foreground">Enter your credentials</h3>
                        {broker.credentialFields.map((field) => (
                            <CredentialField key={field.key} field={field} value={form[field.key]}
                                onChange={(v) => setForm((p) => ({ ...p, [field.key]: v }))} disabled={isSaving} />
                        ))}
                        <button onClick={handleSaveCredentials}
                            disabled={!form.apiKey.trim() || !form.apiSecret.trim() || isSaving}
                            className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {isSaving ? 'Saving...' : 'Save & Connect'}
                        </button>
                    </>
                )}
            </div>
        </BrokerSetupLayout>
    );
}
