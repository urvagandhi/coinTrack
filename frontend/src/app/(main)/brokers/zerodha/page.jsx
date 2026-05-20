'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI, BROKERS } from '@/lib/api';
import { BROKERS as BROKER_CONFIG } from '@/lib/brokerConfig';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

    useEffect(() => {
        if (brokerStatus) setCredentialsSaved(true);
    }, [brokerStatus]);

    const handleSaveCredentials = async () => {
        if (!form.apiKey.trim() || !form.apiSecret.trim()) return;
        setIsSaving(true);
        setError('');
        try {
            await brokerAPI.saveZerodhaCredentials({ apiKey: form.apiKey, apiSecret: form.apiSecret });
            setCredentialsSaved(true);
            toast.success('Credentials saved. Redirecting to Zerodha…');
            await handleConnect();
        } catch (err) {
            setError(err.message || 'Failed to save credentials');
            toast.error(err.message || 'Failed to save credentials');
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
            toast.error(err.message || 'Failed to get login URL');
            setIsConnecting(false);
        }
    };

    const statusBadge = isConnected ? (
        <span className="ed-pill ed-pill-gain"><span className="live-dot" />Connected</span>
    ) : null;

    return (
        <BrokerSetupLayout broker={broker} statusBadge={statusBadge}>
            <div className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />

                <div className="px-5 py-4 border-b border-hairline">
                    <p className="eyebrow">
                        {isConnected ? '§ Active Session' : credentialsSaved ? '§ Awaiting Authorisation' : '§ Affidavit'}
                    </p>
                    <h3 className="font-serif text-[18px] text-foreground mt-1 leading-none">
                        {isConnected ? 'Connection details' : credentialsSaved ? 'Authorize with Zerodha' : 'Enter credentials'}
                    </h3>
                </div>

                <div className="p-5 space-y-5">
                    {error && (
                        <div className="flex items-start gap-2 p-3 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss))]/8">
                            <AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--loss))] mt-0.5 flex-shrink-0" />
                            <p className="text-[12px] text-[hsl(var(--loss))]">{error}</p>
                        </div>
                    )}

                    {isConnected ? (
                        <>
                            <div className="flex items-center gap-3 p-4 border border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/8 rounded-sm">
                                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--gain))]" />
                                <div className="flex-1">
                                    <p className="text-[13px] font-medium text-foreground">Zerodha connected</p>
                                    {brokerStatus?.lastSuccessAt && (
                                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tnum">
                                            Last sync · {new Date(brokerStatus.lastSuccessAt).toLocaleString('en-IN')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button onClick={handleConnect} disabled={isConnecting} className="ed-btn ed-btn-ghost w-full">
                                {isConnecting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting…</>) : 'Reconnect (refresh token)'}
                            </button>

                            <Link href="/portfolio?tab=holdings" className="block text-center ed-link text-[12px]">
                                View portfolio
                            </Link>
                        </>
                    ) : credentialsSaved ? (
                        <>
                            {broker.credentialFields.map((field) => (
                                <CredentialField
                                    key={field.key}
                                    field={field}
                                    value={form[field.key]}
                                    onChange={() => {}}
                                    isSaved
                                    onEdit={() => setCredentialsSaved(false)}
                                />
                            ))}
                            <p className="text-[11.5px] text-muted-foreground font-serif italic leading-relaxed">
                                You will be redirected to Zerodha Kite. After successful login, Zerodha returns you here automatically.
                            </p>
                            <button onClick={handleConnect} disabled={isConnecting} className="ed-btn ed-btn-primary w-full">
                                {isConnecting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting to Zerodha…</>) : 'Connect via Zerodha Kite'}
                            </button>
                        </>
                    ) : (
                        <>
                            {broker.credentialFields.map((field) => (
                                <CredentialField
                                    key={field.key}
                                    field={field}
                                    value={form[field.key]}
                                    onChange={(v) => setForm((p) => ({ ...p, [field.key]: v }))}
                                    disabled={isSaving}
                                />
                            ))}
                            <button
                                onClick={handleSaveCredentials}
                                disabled={!form.apiKey.trim() || !form.apiSecret.trim() || isSaving}
                                className="ed-btn ed-btn-primary w-full"
                            >
                                {isSaving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>) : 'Save & Connect'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </BrokerSetupLayout>
    );
}
