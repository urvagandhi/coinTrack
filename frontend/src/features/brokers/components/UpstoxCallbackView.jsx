'use client';

import { BrokerCallbackHandler } from './BrokerCallbackHandler';
import { brokerAPI, BROKERS } from '@/shared/api/client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function UpstoxCallbackInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const urlError =
    searchParams.get('error') || searchParams.get('error_description');

  const handleCallback = async () => {
    if (urlError) throw new Error(`Upstox connection error: ${urlError}`);
    if (!code) throw new Error('No authorization code returned from Upstox');
    await brokerAPI.handleCallback(BROKERS.UPSTOX, code);
  };

  return (
    <BrokerCallbackHandler
      brokerKey='UPSTOX'
      onCallback={handleCallback}
      successRedirect='/brokers/upstox'
    />
  );
}

export function UpstoxCallbackView() {
  return (
    <Suspense
      fallback={
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='size-8 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-800 dark:border-t-neutral-200 animate-spin' />
        </div>
      }
    >
      <UpstoxCallbackInner />
    </Suspense>
  );
}

export default UpstoxCallbackView;
