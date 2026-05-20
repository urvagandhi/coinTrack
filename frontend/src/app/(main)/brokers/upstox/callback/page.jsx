'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { brokerAPI, BROKERS } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function CallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const ranRef = useRef(false);

    const [state, setState] = useState({ status: 'pending', message: 'Completing Upstox connection…' });

    useEffect(() => {
        if (ranRef.current) return;
        ranRef.current = true;

        const code = searchParams.get('code');
        const errParam = searchParams.get('error') || searchParams.get('error_description');

        if (errParam) {
            setState({ status: 'error', message: errParam });
            toast.error(errParam);
            const t = setTimeout(() => router.replace('/brokers/upstox'), 1800);
            return () => clearTimeout(t);
        }
        if (!code) {
            setState({ status: 'error', message: 'No authorization code returned from Upstox.' });
            const t = setTimeout(() => router.replace('/brokers/upstox'), 1800);
            return () => clearTimeout(t);
        }

        (async () => {
            try {
                await brokerAPI.handleCallback(BROKERS.UPSTOX, code);
                queryClient.invalidateQueries({ queryKey: ['brokers'] });
                queryClient.invalidateQueries({ queryKey: ['portfolio'] });
                setState({ status: 'success', message: 'Upstox connected successfully' });
                toast.success('Upstox connected!');
                setTimeout(() => router.replace('/brokers/upstox'), 1200);
            } catch (err) {
                const msg = err?.message || 'Failed to complete Upstox connection';
                setState({ status: 'error', message: msg });
                toast.error(msg);
                setTimeout(() => router.replace('/brokers/upstox'), 1800);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                    {state.status === 'pending' && (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-foreground">{state.message}</p>
                            <p className="text-xs text-muted-foreground">Don&apos;t close this tab.</p>
                        </>
                    )}
                    {state.status === 'success' && (
                        <>
                            <CheckCircle2 className="h-10 w-10 text-gain" />
                            <p className="text-sm font-medium text-foreground">{state.message}</p>
                            <p className="text-xs text-muted-foreground">Redirecting…</p>
                        </>
                    )}
                    {state.status === 'error' && (
                        <Alert variant="destructive" className="text-left">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{state.message}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function UpstoxCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        }>
            <CallbackInner />
        </Suspense>
    );
}
