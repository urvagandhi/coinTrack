// src/app/(main)/brokers/upstox/callback/page.jsx
'use client';

import { brokerAPI, BROKERS } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { BrokerCallbackHandler } from '../../_shared/BrokerCallbackHandler';

function UpstoxCallbackInner() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const urlError = searchParams.get('error');

    const handleCallback = async () => {
        if (urlError) throw new Error('Upstox connection failed: ' + urlError);
        if (!code) throw new Error('No authorization code in URL');
        await brokerAPI.handleCallback(BROKERS.UPSTOX, { requestToken: code });
    };

    return (
        <BrokerCallbackHandler
            brokerKey="UPSTOX"
            onCallback={handleCallback}
            successRedirect="/brokers"
        />
    );
}

export default function UpstoxCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
        }>
            <UpstoxCallbackInner />
        </Suspense>
    );
}
