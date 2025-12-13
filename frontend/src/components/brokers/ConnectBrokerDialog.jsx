'use client';
import X from 'lucide-react/dist/esm/icons/x';
import { useState } from 'react';

export default function ConnectBrokerDialog({ isOpen, onClose, onSubmit, isConnecting }) {
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ zerodhaApiKey: apiKey, zerodhaApiSecret: apiSecret });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Zerodha</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter your Kite Connect API credentials. You can find these in your Zerodha Developer Console.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Zerodha API Key
                        </label>
                        <input
                            type="text"
                            required
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. abc123xyz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Zerodha API Secret
                        </label>
                        <input
                            type="password"
                            required
                            value={apiSecret}
                            onChange={(e) => setApiSecret(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isConnecting}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isConnecting ? 'Connecting...' : 'Continue to Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
