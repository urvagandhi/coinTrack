'use client';

import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { brokerAPI, portfolioAPI } from '@/lib/api';
import { BROKERS as BROKER_CONFIG } from '@/lib/brokerConfig';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BrokerSetupLayout } from '../_shared/BrokerSetupLayout';
import { CredentialField } from '../_shared/CredentialField';

const broker = BROKER_CONFIG.ANGEL_ONE;
const EMPTY_FORM = { apiKey: '', clientCode: '', password: '', totpSecret: '' };

export default function AngelOnePage() {
    const queryClient = useQueryClient();
    const { data: syncData } = useBrokerConnection();
    const brokerStatus = syncData?.brokers?.find((b) => b.broker === 'ANGEL_ONE');
    const isConnected = brokerStatus?.tokenActive ?? false;
    const isExpired = brokerStatus && !brokerStatus.tokenActive && brokerStatus.lastStatus !== null;

    const [form, setForm] = useState(EMPTY_FORM);
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (brokerStatus) setCredentialsSaved(true);
    }, [brokerStatus]);

    const handleSaveCredentials = async () => {
        const required = broker.credentialFields.map((f) => f.key);
        const missing = required.filter((k) => !form[k]?.trim());
        if (missing.length) { setError(`Please fill in: ${missing.join(', ')}`); return; }
        setIsSaving(true);
        setError('');
        try {
            await brokerAPI.saveAngelOneCredentials(form);
            setCredentialsSaved(true);
            toast.success('Angel One credentials saved');
            queryClient.invalidateQueries({ queryKey: ['brokers'] });
        } catch (err) {
            const msg = err?.message || 'Failed to save credentials';
            setError(msg); toast.error(msg);
        } finally { setIsSaving(false); }
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setError('');
        try {
            await brokerAPI.connectAngelOne();
            toast.success('Angel One connected successfully');
            try { await portfolioAPI.manualRefresh(); } catch { /* non-critical */ }
            queryClient.invalidateQueries({ queryKey: ['brokers'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        } catch (err) {
            const msg = err?.message || 'Connection failed';
            let friendly = msg;
            if (msg.toLowerCase().includes('totp')) friendly = 'The TOTP secret appears incorrect. Verify it matches what Angel One showed you.';
            else if (msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('invalid')) friendly = 'Client Code or password is incorrect. Please check and try again.';
            setError(friendly); toast.error(friendly);
        } finally { setIsConnecting(false); }
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        try {
            await brokerAPI.disconnectAngelOne();
            toast.success('Angel One disconnected');
            setCredentialsSaved(false);
            setForm(EMPTY_FORM);
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
                        {isConnected ? '§ Active Session' : credentialsSaved ? '§ Awaiting Connection' : '§ Affidavit'}
                    </p>
                    <h3 className="font-serif text-[18px] text-foreground mt-1 leading-none">
                        {isConnected ? 'Connection details' : credentialsSaved ? 'Connect to Angel One' : 'Enter credentials'}
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
                            <p className="text-[11.5px] text-[hsl(var(--loss))]">Session expired — reconnect. The backend will auto-refresh going forward.</p>
                        </div>
                    )}

                    {isConnected ? (
                        <>
                            <div className="flex items-center gap-3 p-4 border border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/8 rounded-sm">
                                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--gain))]" />
                                <div className="flex-1">
                                    <p className="text-[13px] font-medium text-foreground">Angel One connected</p>
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
                                Angel One uses direct authentication — no browser redirect needed. CoinTrack connects instantly.
                            </p>
                            <button onClick={handleConnect} disabled={isConnecting} className="ed-btn ed-btn-primary w-full">
                                {isConnecting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting…</>) : 'Connect Angel One'}
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
                            <div className="flex items-start gap-2 p-3 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent-muted))]/40">
                                <Info className="h-3.5 w-3.5 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-foreground leading-relaxed">
                                    Your TOTP secret is the base32 key shown when setting up TOTP in Angel One — <strong>not</strong> the 6-digit code. Example: <code className="font-mono text-[hsl(var(--accent))]">JBSWY3DPEHPK3PXP</code>
                                </p>
                            </div>
                            <button
                                onClick={handleSaveCredentials}
                                disabled={isSaving || broker.credentialFields.some((f) => !form[f.key]?.trim())}
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
