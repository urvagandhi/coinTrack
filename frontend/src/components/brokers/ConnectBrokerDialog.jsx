'use client';
import X from 'lucide-react/dist/esm/icons/x';
import { useState } from 'react';

import { CircleHelp } from 'lucide-react';

export default function ConnectBrokerDialog({ isOpen, onClose, onSubmit, isConnecting }) {
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);

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

                <div className="mb-6 relative">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect Zerodha</h2>
                        <div
                            className="relative"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            onClick={() => setShowTooltip(!showTooltip)}
                        >
                            <CircleHelp className="w-5 h-5 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />

                            {/* Tooltip */}
                            {showTooltip && (
                                <div className="absolute left-0 bottom-full mb-2 w-80 sm:w-96 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 text-left text-sm">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How to connect Zerodha?</h3>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Go to <a href="https://developers.kite.trade/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Kite Connect Developer Portal</a>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300 mb-1">Create a new App:</p>
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded text-xs space-y-1 border border-gray-100 dark:border-gray-800">
                                                    <p><span className="font-medium">Type:</span> Personal</p>
                                                    <p><span className="font-medium">Redirect URL:</span></p>
                                                    <code className="block bg-gray-100 dark:bg-gray-800 p-1 rounded break-all select-all">
                                                        https://cointrack-15gt.onrender.com/api/kite/callback
                                                    </code>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                Copy your <strong>API Key</strong> and <strong>API Secret</strong> and paste them below.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-[-6px] left-2 w-3 h-3 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 transform rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter your Kite Connect API credentials.
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
