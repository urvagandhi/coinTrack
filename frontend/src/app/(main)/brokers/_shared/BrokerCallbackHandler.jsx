'use client';

import { getBrokerByKey } from '@/lib/brokerConfig';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function BrokerCallbackHandler({ brokerKey, onCallback, successRedirect = '/brokers' }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const broker = getBrokerByKey(brokerKey);
    const called = useRef(false);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['brokers', 'sync-status'] });
        queryClient.invalidateQueries({ queryKey: ['brokers'] });
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    };

    const runCallback = () => {
        setStatus('loading');
        setErrorMessage('');
        onCallback()
            .then(() => {
                invalidate();
                setStatus('success');
                setTimeout(() => router.push(successRedirect), 1800);
            })
            .catch((err) => {
                if (err?.status === 400 || err?.original?.response?.status === 400) {
                    invalidate();
                    setStatus('success');
                    setTimeout(() => router.push(successRedirect), 1800);
                    return;
                }
                setStatus('error');
                setErrorMessage(err?.message || err?.original?.message || 'Connection failed. Please try again.');
            });
    };

    useEffect(() => {
        if (called.current) return;
        called.current = true;
        runCallback();
        const t = setTimeout(() => {
            setStatus((s) => (s === 'loading' ? 'stalled' : s));
        }, 12000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="ed-card relative max-w-md w-full px-8 py-12 text-center">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />

                <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="index-num tnum">[ CALLBACK ]</span>
                    <span className="h-px w-8 bg-hairline" />
                    <span className="eyebrow">{broker?.displayName || 'Broker'}</span>
                </div>

                {status === 'loading' && (
                    <div className="space-y-5">
                        <Loader2 className="h-10 w-10 text-[hsl(var(--accent))] mx-auto animate-spin" strokeWidth={1.5} />
                        <div>
                            <p className="font-serif italic text-[24px] text-foreground mb-2">Tokens in transit…</p>
                            <p className="text-[12px] text-muted-foreground">Exchanging credentials and reconciling your portfolio.</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-5">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-sm border-2 border-[hsl(var(--gain))]/40 bg-[hsl(var(--gain))]/8">
                            <CheckCircle2 className="h-7 w-7 text-[hsl(var(--gain))]" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="font-serif italic text-[24px] text-foreground mb-2">{broker?.displayName} connected.</p>
                            <p className="text-[12px] text-muted-foreground">Returning you to the directory…</p>
                        </div>
                    </div>
                )}

                {status === 'stalled' && (
                    <div className="space-y-5">
                        <Loader2 className="h-10 w-10 text-[hsl(var(--chart-4))] mx-auto animate-spin" strokeWidth={1.5} />
                        <div>
                            <p className="font-serif italic text-[24px] text-foreground mb-2">This is taking longer than usual.</p>
                            <p className="text-[12px] text-muted-foreground">
                                Open DevTools → Network and click Retry. Look for <code className="font-mono text-foreground">POST /api/brokers/callback</code>.
                            </p>
                        </div>
                        <div className="flex justify-center gap-2 pt-2">
                            <button onClick={() => { called.current = false; runCallback(); }} className="ed-btn ed-btn-primary">Retry</button>
                            <button onClick={() => router.push('/brokers')} className="ed-btn ed-btn-ghost">Back</button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-5">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-sm border-2 border-[hsl(var(--loss))]/40 bg-[hsl(var(--loss))]/8">
                            <XCircle className="h-7 w-7 text-[hsl(var(--loss))]" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="font-serif italic text-[24px] text-foreground mb-2">Connection failed.</p>
                            <p className="text-[12px] text-muted-foreground">{errorMessage}</p>
                        </div>
                        <div className="flex justify-center gap-2 pt-2">
                            <button onClick={() => router.push(broker?.setupPath || '/brokers')} className="ed-btn ed-btn-primary">Try again</button>
                            <button onClick={() => router.push('/brokers')} className="ed-btn ed-btn-ghost">Back</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
