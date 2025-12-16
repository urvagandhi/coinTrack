'use client';

import { brokerAPI, BROKERS } from '@/lib/api';
import { logger } from '@/lib/logger';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function ZerodhaCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Connecting to Zerodha...');

    const hasCalled = useRef(false);

    useEffect(() => {
        const requestToken = searchParams.get('request_token');
        const error = searchParams.get('error');

        // Prevent double execution in strict mode
        if (hasCalled.current) return;

        if (error) {
            hasCalled.current = true;
            setStatus('error');
            setMessage('Zerodha connection failed: ' + error);
            return;
        }

        if (!requestToken) {
            hasCalled.current = true;
            setStatus('error');
            setMessage('Invalid callback: No request token found.');
            return;
        }

        const completeConnection = async () => {
            try {
                hasCalled.current = true;
                logger.info('Processing Zerodha callback', { requestToken: '***' });
                await brokerAPI.handleCallback(BROKERS.ZERODHA, requestToken);

                setStatus('success');
                setMessage('Connected successfully! Redirecting...');
                
                // Short delay to show success state before redirect
                setTimeout(() => {
                    // Redirect to the main connected brokers page to show "Connected" status
                    // This implicitly strips query params
                    router.replace('/brokers');
                }, 1500);

            } catch (err) {
                logger.error('Zerodha connection error', { error: err.message });

                // UX Polish: Graceful handling for reused/expired tokens
                if (err.response?.status === 400 || err.message?.includes('Token')) {
                    setStatus('success');
                    setMessage('Session already connected. Redirecting...');
                    setTimeout(() => {
                        router.replace('/brokers');
                    }, 1500);
                    return;
                }

                setStatus('error');
                setMessage(err.message || 'Failed to connect to Zerodha');
            }
        };

        completeConnection();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                {status === 'processing' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connecting...</h2>
                        <p className="text-gray-500 dark:text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h2>
                        <p className="text-green-600 dark:text-green-400">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Failed</h2>
                        <p className="text-red-600 dark:text-red-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.replace('/brokers/zerodha')}
                            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                        >
                            Return to Brokers
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ZerodhaCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ZerodhaCallbackContent />
        </Suspense>
    );
}
