'use client';

import { BrokerCallbackHandler } from './BrokerCallbackHandler';
import { brokerAPI, BROKERS } from '@/shared/api/client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ZerodhaCallbackInner() {
  const searchParams = useSearchParams();
  const requestToken = searchParams.get('request_token');
  const urlError = searchParams.get('error');

  const handleCallback = async () => {
    if (urlError) throw new Error(`Zerodha connection failed: ${urlError}`);
    if (!requestToken) throw new Error('No request token in URL');
    await brokerAPI.handleCallback(BROKERS.ZERODHA, requestToken);
  };

  return (
    <BrokerCallbackHandler
      brokerKey='ZERODHA'
      onCallback={handleCallback}
      successRedirect='/brokers/zerodha'
    />
  );
}

export function ZerodhaCallbackView() {
  return (
    <Suspense
      fallback={
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='size-8 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-800 dark:border-t-neutral-200 animate-spin' />
        </div>
      }
    >
      <ZerodhaCallbackInner />
    </Suspense>
  );
}

export default ZerodhaCallbackView;
