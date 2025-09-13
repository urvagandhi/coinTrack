'use client';

import { useAuth } from '../contexts/AuthContext';
import { zerodhaService } from '../lib/zerodhaService';
import { useState, useEffect } from 'react';


import { CheckCircleIcon, KeyIcon, LinkIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

export default function ZerodhaPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [accountStatus, setAccountStatus] = useState(null);
    const [hasCredentials, setHasCredentials] = useState(false);
    const [checkingCredentials, setCheckingCredentials] = useState(true);
    const [credentials, setCredentials] = useState({
        zerodhaApiKey: '',
        zerodhaApiSecret: ''
    });

    useEffect(() => {
        if (user) {
            checkAccountStatus();
            checkCredentialsStatus();
        }
        
        // Check for URL parameters from backend redirect
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const successParam = urlParams.get('success');
        const connectedParam = urlParams.get('connected');
        
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (successParam && connectedParam) {
            setSuccess('Zerodha account connected successfully!');
            // Refresh account status
            if (user) {
                checkAccountStatus();
            }
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [user]);

    const checkAccountStatus = async () => {
        try {
            const status = await zerodhaService.getAccountStatus(user.id);
            setAccountStatus(status);
        } catch (err) {
            setAccountStatus(null);
        }
    };

    const checkCredentialsStatus = async () => {
        setCheckingCredentials(true);
        try {
            const credentialsStatus = await zerodhaService.checkCredentials(user.id);
            setHasCredentials(credentialsStatus.hasCredentials);
        } catch (err) {
            setHasCredentials(false);
        } finally {
            setCheckingCredentials(false);
        }
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await zerodhaService.setCredentials({
                appUserId: user.id,
                zerodhaApiKey: credentials.zerodhaApiKey,
                zerodhaApiSecret: credentials.zerodhaApiSecret
            });
            setSuccess('Zerodha credentials saved successfully!');
            setCredentials({ zerodhaApiKey: '', zerodhaApiSecret: '' });
            await checkCredentialsStatus();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectZerodha = async () => {
        setLoading(true);
        setError('');
        try {
            const loginUrl = await zerodhaService.getLoginUrl(user.id);
            window.location.href = loginUrl;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="flex items-center justify-center h-96"><span>Loading...</span></div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-orange-500 to-pink-500">Zerodha Integration</h1>

            {error && (
                <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <ExclamationCircleIcon className="h-6 w-6 mr-2 text-red-500" />
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <CheckCircleIcon className="h-6 w-6 mr-2 text-green-500" />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Status Card */}
                <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-blue-50 via-white to-orange-50 border border-blue-100 flex flex-col items-start">
                    <div className="flex items-center mb-4 text-gray-500">
                        <span className="text-xl font-bold">Account Status</span>
                    </div>
                    {accountStatus ? (
                        <div className="flex items-center text-green-600 font-semibold">
                            <CheckCircleIcon className="h-6 w-6 mr-1" />
                            <span>{accountStatus}</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-gray-500">
                            <ExclamationCircleIcon className="h-6 w-6 mr-1" />
                            <span>Zerodha account not linked</span>
                        </div>
                    )}
                </div>

                {/* Credentials Card */}
                <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-orange-50 via-white to-blue-50 border border-orange-100 flex flex-col items-start">
                    <div className="flex items-center mb-4">
                        <span className="text-xl font-bold text-gray-500">API Credentials</span>
                    </div>
                    {checkingCredentials ? (
                        <div className="flex flex-col items-center w-full py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            <span className="text-gray-600">Checking credentials status...</span>
                        </div>
                    ) : !hasCredentials ? (
                        <form onSubmit={handleCredentialsSubmit} className="space-y-4 w-full">
                            <div>
                                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <input
                                    type="text"
                                    id="apiKey"
                                    value={credentials.zerodhaApiKey}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, zerodhaApiKey: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your Zerodha API key"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                                <input
                                    type="password"
                                    id="apiSecret"
                                    value={credentials.zerodhaApiSecret}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, zerodhaApiSecret: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter your Zerodha API secret"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2 rounded-md font-semibold hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                            >
                                {loading ? 'Saving...' : 'Save Credentials'}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col w-full">
                            <div className="flex items-center space-x-2 mb-2">
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                <span className="text-gray-700">Credentials configured</span>
                            </div>
                            <button
                                onClick={() => {
                                    setHasCredentials(false);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline self-start"
                            >
                                Update credentials
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Link Account Card - Full width below */}
            {hasCredentials && (
                <div className="rounded-xl shadow-lg p-6 mt-8 bg-gradient-to-r from-orange-100 via-white to-blue-100 border border-blue-200 flex flex-col items-start">
                    <div className="flex items-center mb-4">
                        <LinkIcon className="h-8 w-8 text-orange-500 mr-2" />
                        <span className="text-xl font-bold text-gray-500">Link Zerodha Account</span>
                    </div>
                    <span className="text-gray-600 mb-4">Click below to link your Zerodha account. You'll be redirected to Zerodha's login page.</span>
                    <button
                        onClick={handleConnectZerodha}
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 to-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:from-orange-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Connecting...' : 'Connect to Zerodha'}
                    </button>
                </div>
            )}
        </div>
    );
}