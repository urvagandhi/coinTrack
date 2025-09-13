'use client';

import { useAuth } from '../../contexts/AuthContext';
import { zerodhaService } from '../../lib/zerodhaService';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ZerodhaCallback() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Processing Zerodha connection...');

    useEffect(() => {
        if (user) {
            handleCallback();
        }
    }, [user, searchParams]);

    const handleCallback = async () => {
        try {
            // Extract request_token from URL parameters
            const requestToken = searchParams.get('request_token');
            const action = searchParams.get('action');
            const loginStatus = searchParams.get('status');

            // Check if the callback is successful
            if (action !== 'login' || loginStatus !== 'success' || !requestToken) {
                setStatus('error');
                setMessage('Zerodha login failed or was cancelled. Please try again.');
                return;
            }

            setMessage('Connecting your Zerodha account...');

            // Send request token to backend to complete the connection
            const result = await zerodhaService.connectAccount(requestToken, user.id);

            setStatus('success');
            setMessage('Zerodha account connected successfully!');

            // Redirect to Zerodha page after 2 seconds
            setTimeout(() => {
                router.push('/zerodha');
            }, 2000);

        } catch (error) {
            console.error('Zerodha callback error:', error);
            setStatus('error');
            setMessage(`Connection failed: ${error.message}`);
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'processing':
                return (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                );
            case 'success':
                return (
                    <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'processing':
                return 'text-blue-600';
            case 'success':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        {getStatusIcon()}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Zerodha Connection
                    </h1>

                    <p className={`text-lg ${getStatusColor()} mb-4`}>
                        {message}
                    </p>

                    {status === 'error' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/zerodha')}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}

                    {status === 'success' && (
                        <p className="text-sm text-gray-500">
                            Redirecting to Zerodha page...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}