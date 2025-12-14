'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { useZerodhaDashboard } from '@/hooks/useZerodhaDashboard';
import { formatFundName, getShortCompanyName } from '@/lib/stockNameMapping';

import { useEffect, useState } from 'react';

export default function ZerodhaDashboard() {
    const { user } = useAuth();
    // Using the new hook
    const {
        holdings,
        mfHoldings,
        sips,
        profile,
        isLoading: loading,
        error: hookError,
        refreshAll
    } = useZerodhaDashboard();

    // Mapping new hook data to component expected state names if strict match needed,
    // or just using them directly. The hook returns 'holdings', 'mfHoldings', 'sips', 'profile'
    // which matches local state names.

    const { data: brokerStatuses } = useBrokerConnection();
    const accountStatus = brokerStatuses?.find(b => b.broker === 'ZERODHA')?.connected ? 'CONNECTED' : 'NOT_LINKED';

    // const [accountStatus, setAccountStatus] = useState(null); // Removed local state
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (hookError) {
            setError(hookError?.message || 'Failed to load dashboard data');
        }
    }, [hookError]);



    const loadZerodhaData = async () => {
        setSuccessMessage('');
        setError('');
        try {
            await refreshAll();
            setSuccessMessage('Dashboard refreshed successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('Failed to refresh data');
        }
    };

    const calculatePortfolioSummary = () => {
        let totalValue = 0;
        let totalPnL = 0;
        let totalInvested = 0;

        // Calculate stock portfolio
        if (holdings && Array.isArray(holdings)) {
            holdings.forEach(holding => {
                const currentValue = (holding.lastPrice || 0) * (holding.quantity || 0);
                const invested = (holding.averagePrice || 0) * (holding.quantity || 0);
                const pnl = holding.pnl || 0;

                totalValue += currentValue;
                totalPnL += pnl;
                totalInvested += invested;
            });
        }

        // Calculate mutual fund portfolio
        if (mfHoldings && Array.isArray(mfHoldings)) {
            mfHoldings.forEach(mf => {
                const currentValue = (mf.lastPrice || 0) * (mf.quantity || 0);
                const invested = (mf.averagePrice || 0) * (mf.quantity || 0);
                const pnl = currentValue - invested;

                totalValue += currentValue;
                totalPnL += pnl;
                totalInvested += invested;
            });
        }

        return { totalValue, totalPnL, totalInvested };
    };

    const formatCurrency = (amount) => {
        // Handle invalid values
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '₹0.00';
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return '₹0.00';
        }

        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(numAmount);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Zerodha Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={loadZerodhaData}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {successMessage}
                            </div>
                        </div>
                    )}

                    {/* Account Status */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Account Status</h2>
                        {accountStatus ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="font-medium">{accountStatus}</p>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <p>Zerodha account not linked. <a href="/zerodha" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium">Link your account</a></p>
                            </div>
                        )}
                    </div>

                    {/* Profile Section */}
                    {profile && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Profile Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.userName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Short Name</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.userShortname || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Broker</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.broker || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User Type</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.userType || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Exchanges</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {profile.exchanges ? profile.exchanges.join(', ') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Portfolio Summary */}
                    {((holdings && Array.isArray(holdings) && holdings.length > 0) || (mfHoldings && Array.isArray(mfHoldings) && mfHoldings.length > 0)) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invested</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(calculatePortfolioSummary().totalInvested)}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Value</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(calculatePortfolioSummary().totalValue)}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P&L</h3>
                                <p className={`text-2xl font-bold ${calculatePortfolioSummary().totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(calculatePortfolioSummary().totalPnL)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Stock Holdings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Stock Holdings</h2>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : holdings ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Company</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Symbol</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Exchange</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Qty</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Avg Price</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Current Price</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {holdings && Array.isArray(holdings) && holdings.map((holding, index) => {
                                            const currentValue = (holding.lastPrice || 0) * (holding.quantity || 0);
                                            const investedValue = (holding.averagePrice || 0) * (holding.quantity || 0);
                                            const pnlPercentage = investedValue > 0 ? ((holding.pnl || 0) / investedValue) * 100 : 0;

                                            return (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                                                        <div className="font-medium">{getShortCompanyName(holding.tradingSymbol)}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">ISIN: {holding.isin || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                                                        {holding.tradingSymbol || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                                        {holding.exchange || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        {holding.quantity || 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(holding.averagePrice || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(holding.lastPrice || 0)}
                                                    </td>
                                                    <td className={`px-4 py-3 font-medium ${(holding.pnl || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        <div>{formatCurrency(holding.pnl || 0)}</div>
                                                        <div className="text-xs">({pnlPercentage.toFixed(2)}%)</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {(!holdings || !Array.isArray(holdings) || holdings.length === 0) && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No stock holdings found</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Unable to load stock holdings</p>
                        )}
                    </div>

                    {/* Mutual Fund Holdings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Mutual Fund Holdings</h2>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : mfHoldings ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Fund Name</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">ISIN</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Units</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Avg Price</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Current Price</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Current Value</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {mfHoldings && Array.isArray(mfHoldings) && mfHoldings.map((holding, index) => {
                                            const currentValue = (holding.lastPrice || 0) * (holding.quantity || 0);
                                            const investedValue = (holding.averagePrice || 0) * (holding.quantity || 0);
                                            const pnl = currentValue - investedValue;
                                            const pnlPercentage = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

                                            return (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        <div>{formatFundName(holding.fund)}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Folio: {holding.folio || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                                                        {holding.tradingsymbol || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        {(holding.quantity || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(holding.averagePrice || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(holding.lastPrice || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(currentValue)}
                                                    </td>
                                                    <td className={`px-4 py-3 font-medium ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        <div>{formatCurrency(pnl)}</div>
                                                        <div className="text-xs">({pnlPercentage.toFixed(2)}%)</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {(!mfHoldings || !Array.isArray(mfHoldings) || mfHoldings.length === 0) && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No mutual fund holdings found</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Unable to load mutual fund holdings</p>
                        )}
                    </div>

                    {/* SIPs */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">SIP Orders</h2>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : sips ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Fund</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">ISIN</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Amount</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Frequency</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Status</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Next Due</th>
                                            <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-medium">Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {sips && sips.data && sips.data.map((sip, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    <div>{formatFundName(sip.fund)}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Day: {sip.instalment_day}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                                                    {sip.tradingsymbol || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                    {formatCurrency(sip.instalment_amount || 0)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 capitalize">
                                                    {sip.frequency || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sip.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {sip.status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                    <div>{sip.next_instalment ? new Date(sip.next_instalment).toLocaleDateString('en-IN') : 'N/A'}</div>
                                                    {sip.last_instalment && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Last: {new Date(sip.last_instalment).toLocaleDateString('en-IN')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                    <div>{sip.completed_instalments || 0} instalments</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Since: {sip.created ? new Date(sip.created).toLocaleDateString('en-IN') : 'N/A'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(!sips.data || sips.data.length === 0) && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No SIP orders found</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Unable to load SIP data</p>
                        )}
                    </div>
                </div>
            </main>
        </div >
    );
}
