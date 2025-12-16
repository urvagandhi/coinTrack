'use client';

import { ChevronDown, ChevronRight, History } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';

// Helper to format currency consistently
const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 4
    }).format(num);
};

export default function MfSipList({ sips, unlinkedOrders, isLoading, onNavigate, initialContext }) {
    const [expandedSipId, setExpandedSipId] = useState(null);

    // Auto-expand SIP if specified in initialContext
    useEffect(() => {
        if (initialContext?.expandSipId && sips) {
            const sipExists = sips.find(s => s.sipId === initialContext.expandSipId);
            if (sipExists) {
                setExpandedSipId(initialContext.expandSipId);
            }
        }
    }, [initialContext, sips]);


    const toggleExpand = (sipId) => {
        setExpandedSipId(expandedSipId === sipId ? null : sipId);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!sips || sips.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No active SIPs found.
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8">
            {/* Active SIPs Table */}
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="pb-4 pl-4 w-8"></th>
                            <th className="pb-4 pl-2">Fund</th>
                            <th className="pb-4 text-right">Amount</th>
                            <th className="pb-4 text-right">Schedule</th>
                            <th className="pb-4 text-right">Progress</th>
                            <th className="pb-4 text-right pr-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="space-y-4">
                        {sips.map((sip, idx) => {
                            const isExpanded = expandedSipId === sip.sipId;
                            const nextDate = sip.nextInstalmentDate ? new Date(sip.nextInstalmentDate) : null;
                            const isActive = sip.status === 'ACTIVE';

                            return (
                                <Fragment key={sip.sipId || idx}>
                                    <tr
                                        className={`border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50 dark:bg-gray-800/30' : ''}`}
                                        onClick={() => toggleExpand(sip.sipId)}
                                    >
                                        <td className="py-4 pl-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </td>
                                        <td className="py-4 pl-2">
                                            <div className="font-medium text-gray-900 dark:text-white max-w-xs truncate" title={sip.fund}>
                                                {sip.fund}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {sip.folio || '-'} | {sip.tradingSymbol || '-'}
                                            </div>
                                            {/* ID Pill */}
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    ID: {sip.sipId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(sip.instalmentAmount)}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">
                                                {sip.frequency}
                                            </div>
                                            {sip.stepUp && Object.keys(sip.stepUp).length > 0 && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 mt-1">
                                                    Step Up
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right text-gray-600 dark:text-gray-300">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                    {nextDate ? nextDate.toLocaleDateString() : 'No Date'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-0.5">
                                                    Day {sip.instalmentDay || '?'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {sip.completedInstalments} Paid
                                                </span>
                                                {sip.totalInstalments > 0 && (
                                                    <span className="text-[10px] text-gray-400 mt-0.5">
                                                        of {sip.totalInstalments} Total
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right pr-4">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${sip.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                sip.status === 'PAUSED' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                }`}>
                                                {sip.status}
                                            </span>
                                        </td>
                                    </tr>

                                    {/* Expanded History */}
                                    {isExpanded && (
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/20 shadow-inner">
                                            <td colSpan="6" className="px-4 py-4">
                                                <div className="ml-10 border-l-2 border-dashed border-gray-200 dark:border-gray-700 pl-6">
                                                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        <History size={14} className="text-purple-500" />
                                                        <h3>Execution History</h3>
                                                    </div>

                                                    {!sip.executions || sip.executions.length === 0 ? (
                                                        <div className="text-gray-500 italic text-sm py-2">No execution history available.</div>
                                                    ) : (
                                                        <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
                                                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                                                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left">Date</th>
                                                                        <th className="px-4 py-2 text-right">Amount</th>
                                                                        <th className="px-4 py-2 text-right">NAV</th>
                                                                        <th className="px-4 py-2 text-center">Status</th>
                                                                        <th className="px-4 py-2 text-right">Order Ref</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-5 dark:divide-gray-800/50 text-xs">
                                                                    {sip.executions.map((exec, eIdx) => (
                                                                        <tr key={exec.orderId || eIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                                                                                {exec.executionDate ? new Date(exec.executionDate).toLocaleDateString() :
                                                                                    exec.orderTimestamp ? new Date(exec.orderTimestamp).toLocaleDateString() : '-'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                                                                                {formatCurrency(exec.amount)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-gray-500">
                                                                                {exec.executedNav ? `₹${exec.executedNav}` : '-'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${exec.status === 'COMPLETE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                                                                    {exec.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-gray-400 font-mono text-[10px]">
                                                                                {exec.orderId}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {onNavigate && (
                                                        <div className="mt-3 flex justify-end">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onNavigate('timeline', { sipId: sip.sipId, highlightSipId: sip.sipId });
                                                                }}
                                                                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center transition-colors"
                                                            >
                                                                View SIP history in Timeline <ChevronRight size={12} className="ml-1" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Unlinked SIP Orders Section (Orphaned) */}
            {unlinkedOrders && unlinkedOrders.length > 0 && (
                <div className="mt-8 pt-8 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Unlinked Executions</h3>
                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-medium border border-amber-200 dark:border-amber-800">
                                {unlinkedOrders.length} Orphans
                            </span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-amber-50 dark:bg-amber-900/10 text-xs font-medium text-amber-900/70 dark:text-amber-400/80 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Fund Name</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-right">NAV</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Order Ref</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30 bg-white dark:bg-gray-900">
                                {unlinkedOrders.map((order, idx) => (
                                    <tr key={order.orderId || idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                                            {order.executionDate ? new Date(order.executionDate).toLocaleDateString() :
                                                order.orderTimestamp ? new Date(order.orderTimestamp).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-md truncate" title={order.fund}>
                                            {order.fund}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(order.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500">
                                            {order.executedNav ? `₹${order.executedNav}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'COMPLETE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                                            {order.orderId}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
