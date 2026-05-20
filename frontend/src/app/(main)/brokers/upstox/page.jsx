'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI, BROKERS } from '@/lib/api';
import { BROKERS as BROKER_CONFIG } from '@/lib/brokerConfig';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BrokerSetupLayout } from '../_shared/BrokerSetupLayout';
import { CredentialField } from '../_shared/CredentialField';

const broker = BROKER_CONFIG.UPSTOX;
const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function UpstoxPage() {
    const queryClient = useQueryClient();
    const { data: syncData } = useBrokerConnection();
    const brokerStatus = syncData?.brokers?.find((b) => b.broker === 'UPSTOX');
    const isConnected = brokerStatus?.tokenActive ?? false;
    const isExpired = brokerStatus && !brokerStatus.tokenActive && brokerStatus.lastStatus !== null;

    const [form, setForm] = useState({ apiKey: '', apiSecret: '', redirectUri: '' });
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (brokerStatus) setCredentialsSaved(true);
        if (!form.redirectUri && APP_URL) {
            setForm((p) => ({ ...p, redirectUri: `${APP_URL}/brokers/upstox/callback` }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brokerStatus]);

    const handleSaveCredentials = async () => {
        const required = ['apiKey', 'apiSecret', 'redirectUri'];
        const missing = required.filter((k) => !form[k]?.trim());
        if (missing.length) { setError(`Please fill in: ${missing.join(', ')}`); return; }
        setIsSaving(true);
        setError('');
        try {
            await brokerAPI.saveUpstoxCredentials(form);
            setCredentialsSaved(true);
            toast.success('Upstox credentials saved');
            queryClient.invalidateQueries({ queryKey: ['brokers'] });
        } catch (err) {
            setError(err.message || 'Failed to save credentials');
            toast.error(err.message || 'Failed to save credentials');
        } finally { setIsSaving(false); }
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setError('');
        try {
            const response = await brokerAPI.getConnectUrl(BROKERS.UPSTOX);
            if (response?.loginUrl) window.location.href = response.loginUrl;
            else throw new Error('No login URL received');
        } catch (err) {
            setError(err.message || 'Failed to get Upstox login URL');
            toast.error(err.message || 'Failed to get Upstox login URL');
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        try {
            await brokerAPI.disconnectUpstox();
            toast.success('Upstox disconnected');
            setCredentialsSaved(false);
            setForm({ apiKey: '', apiSecret: '', redirectUri: `${APP_URL}/brokers/upstox/callback` });
            queryClient.invalidateQueries({ queryKey: ['brokers'] });
        } catch (err) { toast.error(err.message || 'Failed to disconnect'); }
        finally { setIsDisconnecting(false); }
    };

    const statusBadge = isConnected ? <span className="ed-pill ed-pill-gain"><span className="live-dot" />Connected</span>
        : isExpired ? <span className="ed-pill ed-pill-loss">Expired</span>
        : credentialsSaved ? <span className="ed-pill ed-pill-warn">Credentials saved</span>
        : null;

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
                        {isConnected ? 'Connection details' : credentialsSaved ? 'Authorize with Upstox' : 'Enter credentials'}
                    </h3>
                </div>

                <div className="p-5 space-y-5">
                    {error && (
                        <div className="flex items-start gap-2 p-3 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss))]/8">
                            <AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--loss))] mt-0.5 flex-shrink-0" />
                            <p className="text-[12px] text-[hsl(var(--loss))]">{error}</p>
                        </div>
                    )}

                    {isExpired && !isConnected && (
                        <div className="flex items-start gap-2 p-3 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss))]/8">
                            <AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--loss))] mt-0.5 flex-shrink-0" />
                            <p className="text-[11.5px] text-[hsl(var(--loss))]">Upstox tokens expire daily — reconnect to keep syncing.</p>
                        </div>
                    )}

                    {isConnected ? (
                        <>
                            <div className="flex items-center gap-3 p-4 border border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/8 rounded-sm">
                                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--gain))]" />
                                <div className="flex-1">
                                    <p className="text-[13px] font-medium text-foreground">Upstox connected</p>
                                    {brokerStatus?.lastSuccessAt && (
                                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tnum">
                                            Last sync · {new Date(brokerStatus.lastSuccessAt).toLocaleString('en-IN')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleConnect} disabled={isConnecting} className="ed-btn ed-btn-ghost">
                                    {isConnecting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> …</>) : 'Reconnect'}
                                </button>
                                <button onClick={handleDisconnect} disabled={isDisconnecting} className="ed-btn ed-btn-ghost text-[hsl(var(--loss))]">
                                    {isDisconnecting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> …</>) : 'Disconnect'}
                                </button>
                            </div>
                            <Link href="/portfolio?tab=holdings" className="block text-center ed-link text-[12px]">View portfolio</Link>
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
                                You will be redirected to Upstox to authorize CoinTrack. After login, Upstox returns to your redirect URI with a code.
                            </p>
                            <button onClick={handleConnect} disabled={isConnecting} className="ed-btn ed-btn-primary w-full">
                                {isConnecting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting…</>) : 'Connect via Upstox'}
                            </button>
                            <p className="text-center text-[10px] tracking-[0.16em] uppercase text-muted-foreground">Upstox tokens expire daily.</p>
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
                                disabled={isSaving || !form.apiKey.trim() || !form.apiSecret.trim() || !form.redirectUri.trim()}
                                className="ed-btn ed-btn-primary w-full"
                            >
                                {isSaving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>) : 'Save credentials'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </BrokerSetupLayout>
    );
}
