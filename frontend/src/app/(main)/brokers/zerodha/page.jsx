'use client';

import { useAuth } from '@/contexts/AuthContext';
import { brokerAPI, BROKERS } from '@/lib/api';
import { useEffect, useState } from 'react';

import { ArrowTopRightOnSquareIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, LinkIcon } from '@heroicons/react/24/solid';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    const [showSetupGuide, setShowSetupGuide] = useState(true);

    const checkStatus = async () => {
        setCheckingCredentials(true);
        try {
            const status = await brokerAPI.getStatus(BROKERS.ZERODHA);
            setAccountStatus(status.connected ? 'Connected' : null);
            setHasCredentials(status.hasCredentials);
        } catch (err) {
            setAccountStatus(null);
            setHasCredentials(false);
        } finally {
            setCheckingCredentials(false);
        }
    };

    useEffect(() => {
        if (user) {
            checkStatus();
        }

        // Check for success param from the callback page redirect
        const urlParams = new URLSearchParams(window.location.search);
        const successParam = urlParams.get('success');
        const connectedParam = urlParams.get('connected');

        if (successParam && connectedParam) {
            setSuccess('Zerodha account connected successfully!');
            checkStatus();
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [user]);



    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await brokerAPI.saveZerodhaCredentials({
                apiKey: credentials.zerodhaApiKey,
                apiSecret: credentials.zerodhaApiSecret
            });
            setSuccess('Zerodha credentials saved successfully!');
            setCredentials({ zerodhaApiKey: '', zerodhaApiSecret: '' });
            await checkStatus();
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
            const response = await brokerAPI.getConnectUrl(BROKERS.ZERODHA);
            if (response.loginUrl) {
                window.location.href = response.loginUrl;
            } else {
                throw new Error('No login URL received');
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="flex items-center justify-center h-96"><span>Loading...</span></div>;
    }

    return (
        <div className="container mx-auto px-4 py-6 sm:p-6 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-orange-500 to-pink-500">Zerodha Integration</h1>

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

            {/* First Time Setup Guide - Collapsible */}
            {!hasCredentials && !checkingCredentials && (
                <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 overflow-hidden shadow-sm">
                    <button
                        onClick={() => setShowSetupGuide(!showSetupGuide)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-blue-100/30 dark:hover:bg-blue-800/20 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">First Time Setup Guide</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Learn how to get your Zerodha Kite Connect API credentials</p>
                            </div>
                        </div>
                        {showSetupGuide ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                    </button>

                    {showSetupGuide && (
                        <div className="px-5 pb-5 pt-2 border-t border-blue-100 dark:border-blue-800/50 bg-white/50 dark:bg-gray-900/30">
                            <div className="space-y-4">
                                {/* Step 1 */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">1</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Create a Kite Connect App</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Go to the <a href="https://developers.kite.trade/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium underline inline-flex items-center">
                                                Kite Connect Developer Portal <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-0.5" />
                                            </a> and sign in with your Zerodha account.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">2</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Create a New App</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Click on <strong>"Create new app"</strong>. Fill in the following mandatory fields:
                                        </p>
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Type:</span>
                                                <span className="flex flex-wrap items-center gap-1">
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded text-xs font-medium">Personal</span>
                                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs font-medium">Free</span>
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 pl-0 sm:pl-12 -mt-1">
                                                ✓ Investing, trading, and reports APIs • ✗ No historical chart data • ✗ No live WebSockets
                                            </p>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">App Name:</span>
                                                <span>Any name (e.g., <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">CoinTrack</code>)</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Zerodha Client ID:</span>
                                                <span>Your Zerodha ID (e.g., <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">AB1234</code>)</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Redirect URL:</span>
                                                <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono break-all">https://cointrack-15gt.onrender.com/api/kite/callback</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">3</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Copy Your Credentials</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Once your app is created, you'll see:
                                        </p>
                                        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                            <li><strong>API Key:</strong> A public key for your app</li>
                                            <li><strong>API Secret:</strong> Click "Show API secret" and copy it</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white font-bold text-sm flex items-center justify-center">4</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Enter Credentials Below</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Paste your <strong>API Key</strong> and <strong>API Secret</strong> in the form below. Then click <strong>"Connect to Zerodha"</strong> to link your account.
                                        </p>
                                    </div>
                                </div>

                                {/* Important Note */}
                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                                    <ExclamationCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <strong className="text-amber-800 dark:text-amber-300">Important:</strong>
                                        <span className="text-amber-700 dark:text-amber-400"> Kite Connect API subscription costs ₹2000/month. Make sure you have an active subscription before proceeding.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
