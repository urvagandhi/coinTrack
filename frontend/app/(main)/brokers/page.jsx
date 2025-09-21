'use client';

import React from 'react';

export default function BrokersPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Broker Integrations</h1>
            <p className="text-gray-600 mb-8">
                Connect your brokerage accounts to track your investments.
            </p>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Available Brokers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                        <h3 className="font-medium">Zerodha</h3>
                        <p className="text-sm text-gray-600">India's largest discount broker</p>
                        <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Connect
                        </button>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-medium">Upstox</h3>
                        <p className="text-sm text-gray-600">Technology-driven broker</p>
                        <button className="mt-2 px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed" disabled>
                            Coming Soon
                        </button>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-medium">Angel One</h3>
                        <p className="text-sm text-gray-600">Full-service broker</p>
                        <button className="mt-2 px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed" disabled>
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}