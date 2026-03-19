// src/app/(main)/brokers/zerodha/callback/page.jsx
'use client';

import { brokerAPI, BROKERS } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { BrokerCallbackHandler } from '../../_shared/BrokerCallbackHandler';

function ZerodhaCallbackInner() {
    const searchParams = useSearchParams();
    const requestToken = searchParams.get('request_token');
    const urlError = searchParams.get('error');

    const handleCallback = async () => {
        if (urlError) throw new Error('Zerodha connection failed: ' + urlError);
        if (!requestToken) throw new Error('No request token in URL');
        await brokerAPI.handleCallback(BROKERS.ZERODHA, requestToken);
    };

    return (
        <BrokerCallbackHandler
            brokerKey="ZERODHA"
            onCallback={handleCallback}
            successRedirect="/brokers"
        />
    );
}

export default function ZerodhaCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
        }>
            <ZerodhaCallbackInner />
        </Suspense>
    );
}
