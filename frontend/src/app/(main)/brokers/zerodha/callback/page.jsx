'use client';

import api from '@/lib/api';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ZerodhaCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Connecting to Zerodha...');

    useEffect(() => {
        const processCallback = async () => {
            const requestToken = searchParams.get('request_token');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage('Connection denied by User');
                return;
            }

            if (!requestToken) {
                setStatus('error');
                setMessage('Invalid Callback: Missing request token');
                return;
            }

            try {
                // Call Backend to exchange token
                setMessage('Exchanging tokens...');
                await api.post('/api/brokers/callback', {
                    broker: 'ZERODHA',
                    requestToken: requestToken
                });

                setStatus('success');
                setMessage('Connected successfully! Redirecting...');

                // Redirect back to brokers page after short delay
                setTimeout(() => {
                    router.push('/brokers');
                }, 1500);

            } catch (err) {
                console.error("Token exchange failed", err);
                setStatus('error');
                setMessage(err.response?.data?.message || 'Failed to exchange token with Zerodha.');
            }
        };

        processCallback();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">

                <div className="flex justify-center mb-6">
                    {status === 'processing' && (
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {status === 'processing' ? 'Connecting...' : status === 'success' ? 'Connected!' : 'Connection Failed'}
                </h1>

                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    {message}
                </p>

                {status === 'error' && (
                    <button
                        onClick={() => router.push('/brokers')}
                        className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Back to Brokers
                    </button>
                )}
            </div>
        </div>
    );
}
