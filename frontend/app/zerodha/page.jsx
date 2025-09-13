'use client';

import { useAuth } from '../contexts/AuthContext';
import { zerodhaService } from '../lib/zerodhaService';
import { useState, useEffect } from 'react';

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
    }, [user]);

    const checkAccountStatus = async () => {
        try {
            const status = await zerodhaService.getAccountStatus(user.id);
            setAccountStatus(status);
        } catch (err) {
            // Account not linked yet - this is expected for new users
            setAccountStatus(null);
        }
    };

    const checkCredentialsStatus = async () => {
        setCheckingCredentials(true);
        try {
            const credentialsStatus = await zerodhaService.checkCredentials(user.id);
            setHasCredentials(credentialsStatus.hasCredentials);
        } catch (err) {
            console.error('Error checking credentials:', err);
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
            // Recheck credentials status after successful save
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
            // Get the login URL from backend
            const loginUrl = await zerodhaService.getLoginUrl(user.id);

            // Redirect to Zerodha login
            window.location.href = loginUrl;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Zerodha Integration</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Account Status</h2>
                {accountStatus ? (
                    <div className="text-green-600">
                        <p>{accountStatus}</p>
                    </div>
                ) : (
                    <div className="text-gray-500">
                        <p>Zerodha account not linked</p>
                    </div>
                )}
            </div>

            {/* Set Credentials - Only show if credentials are not set */}
            {checkingCredentials ? (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-center text-gray-600">Checking credentials status...</p>
                </div>
            ) : !hasCredentials ? (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Set Zerodha API Credentials</h2>
                    <p className="text-gray-600 mb-4">
                        Enter your Zerodha API key and secret to link your account. You can get these from your Zerodha Developer Console.
                    </p>

                    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                                API Key
                            </label>
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
                            <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700 mb-1">
                                API Secret
                            </label>
                            <input
                                type="password"
                                id="apiSecret"
                                value={credentials.zerodhaApiSecret}
                                onChange={(e) => setCredentials(prev => ({ ...prev, zerodhaApiSecret: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your Zerodha API secret"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Credentials'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Zerodha API Credentials</h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-green-600">✓</span>
                        <p className="text-gray-600">Credentials are already configured for your account.</p>
                    </div>
                    <button
                        onClick={() => {
                            setHasCredentials(false);
                            setError('');
                            setSuccess('');
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                        Update credentials
                    </button>
                </div>
            )}

            {/* Connect Account - Only show if credentials are set */}
            {hasCredentials && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Link Zerodha Account</h2>
                    <p className="text-gray-600 mb-4">
                        Click below to link your Zerodha account. You'll be redirected to Zerodha's login page.
                    </p>

                    <button
                        onClick={handleConnectZerodha}
                        disabled={loading}
                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Connecting...' : 'Connect to Zerodha'}
                    </button>
                </div>
            )}
        </div>
    );
}