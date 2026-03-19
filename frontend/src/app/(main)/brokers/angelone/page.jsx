// src/app/(main)/brokers/angelone/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI, portfolioAPI } from '@/lib/api';
import { BROKERS as BROKER_CONFIG } from '@/lib/brokerConfig';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BrokerSetupLayout } from '../_shared/BrokerSetupLayout';
import { CredentialField } from '../_shared/CredentialField';

const broker = BROKER_CONFIG.ANGEL_ONE;

export default function AngelOnePage() {
    const queryClient = useQueryClient();
    const { data: syncData } = useBrokerConnection();
    const brokerStatus = syncData?.brokers?.find((b) => b.broker === 'ANGEL_ONE');
    const isConnected = brokerStatus?.tokenActive ?? false;

    const [form, setForm] = useState({ clientId: '', mpin: '', apiKey: '', totpSecret: '' });
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleConnect = async () => {
        const empty = broker.credentialFields.filter((f) => !form[f.key]?.trim());
        if (empty.length > 0) {
            setError(`Please fill in: ${empty.map((f) => f.label).join(', ')}`);
            return;
        }

        setIsConnecting(true);
        setError('');
        try {
            await brokerAPI.saveZerodhaCredentials
                ? await (async () => {
                    // Use generic credential save endpoint
                    const { data } = await (await import('@/lib/api')).default.post('/api/brokers/angelone/credentials', form);
                    return data;
                })()
                : null;

            // Trigger portfolio sync after connecting
            try { await portfolioAPI.manualRefresh(); } catch { /* non-critical */ }

            // Refresh broker status
            queryClient.invalidateQueries({ queryKey: ['brokers'] });
        } catch (err) {
            const msg = err?.message || 'Connection failed';
            if (msg.toLowerCase().includes('totp')) {
                setError('The TOTP secret appears incorrect. Verify it matches what Angel One showed you.');
            } else if (msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('invalid')) {
                setError('Client ID or MPIN is incorrect. Please check and try again.');
            } else {
                setError(msg);
            }
        } finally {
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
                                <p className="text-sm font-medium text-green-700">Angel One connected</p>
                                {brokerStatus?.lastSuccessAt && (
                                    <p className="text-xs text-green-700/70 mt-0.5">
                                        Last synced {new Date(brokerStatus.lastSuccessAt).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button onClick={() => { setError(''); /* re-enter credentials */ }}
                            className="w-full h-9 border border-border text-muted-foreground rounded-lg text-sm hover:bg-accent transition-colors">
                            Update credentials
                        </button>

                        <Link href="/portfolio?tab=holdings" className="block text-center text-sm text-blue-600 hover:underline underline-offset-2 mt-3">
                            View portfolio
                        </Link>
                    </>
                ) : (
                    <>
                        <h3 className="text-sm font-semibold text-foreground">Enter your Angel One credentials</h3>

                        {broker.credentialFields.map((field) => (
                            <CredentialField key={field.key} field={field} value={form[field.key]}
                                onChange={(v) => setForm((p) => ({ ...p, [field.key]: v }))} disabled={isConnecting} />
                        ))}

                        {/* TOTP secret help */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Your TOTP secret is the base32 key shown when you set up Google Authenticator in Angel One — NOT the 6-digit code. It looks like: JBSWY3DPEHPK3PXP
                            </p>
                        </div>

                        <button onClick={handleConnect}
                            disabled={isConnecting || broker.credentialFields.some((f) => !form[f.key]?.trim())}
                            className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                            {isConnecting ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-white animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect Angel One'
                            )}
                        </button>
                    </>
                )}
            </div>
        </BrokerSetupLayout>
    );
}
