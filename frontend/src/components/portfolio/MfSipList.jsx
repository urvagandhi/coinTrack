'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { ChevronDown, ChevronRight, History } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';

// formatCurrency imported from @/lib/format

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!sips || sips.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No active SIPs found.
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8">
            {/* Active SIPs Table */}
            <div className="flex flex-col">
                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                                            className={`border-b border-border last:border-0 hover:bg-accent transition-colors cursor-pointer ${isExpanded ? 'bg-accent' : ''}`}
                                            onClick={() => toggleExpand(sip.sipId)}
                                        >
                                            <td className="py-4 pl-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-600">
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </td>
                                            <td className="py-4 pl-2">
                                                <div className="font-medium text-foreground max-w-xs truncate" title={sip.fund}>
                                                    {sip.fund}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    {sip.folio || '-'} | {sip.tradingSymbol || '-'}
                                                </div>
                                                {/* ID Pill */}
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-muted-foreground">
                                                        ID: {sip.sipId}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="font-medium text-foreground">
                                                    {formatCurrency(sip.instalmentAmount)}
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">
                                                    {sip.frequency}
                                                </div>
                                                {sip.stepUp && Object.keys(sip.stepUp).length > 0 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 mt-1">
                                                        Step Up
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 text-right text-muted-foreground">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {nextDate ? nextDate.toLocaleDateString() : 'No Date'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-0.5">
                                                        Day {sip.instalmentDay || '?'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-medium text-foreground">
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
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${sip.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                                    sip.status === 'PAUSED' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-red-50 text-red-700'
                                                    }`}>
                                                    {sip.status}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Expanded History */}
                                        {isExpanded && (
                                            <tr className="bg-accent shadow-inner">
                                                <td colSpan="6" className="px-4 py-4">
                                                    <div className="ml-10 border-l-2 border-dashed border-border pl-6">
                                                        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
                                                            <History size={14} className="text-blue-600" />
                                                            <h3>Execution History</h3>
                                                        </div>

                                                        {!sip.executions || sip.executions.length === 0 ? (
                                                            <div className="text-muted-foreground italic text-sm py-2">No execution history available.</div>
                                                        ) : (
                                                            <div className="overflow-hidden rounded-lg border border-border shadow-sm bg-card">
                                                                <table className="min-w-full divide-y divide-card-border">
                                                                    <thead className="bg-accent text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left">Date</th>
                                                                            <th className="px-4 py-2 text-right">Amount</th>
                                                                            <th className="px-4 py-2 text-right">NAV</th>
                                                                            <th className="px-4 py-2 text-center">Status</th>
                                                                            <th className="px-4 py-2 text-right">Order Ref</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-card-border text-xs">
                                                                        {sip.executions.map((exec, eIdx) => (
                                                                            <tr key={exec.orderId || eIdx} className="hover:bg-accent transition-colors">
                                                                                <td className="px-4 py-2 text-muted-foreground font-medium">
                                                                                    {exec.executionDate ? new Date(exec.executionDate).toLocaleDateString() :
                                                                                        exec.orderTimestamp ? new Date(exec.orderTimestamp).toLocaleDateString() : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-medium text-foreground">
                                                                                    {formatCurrency(exec.amount)}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right text-muted-foreground">
                                                                                    {exec.executedNav ? `₹${exec.executedNav}` : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-center">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${exec.status === 'COMPLETE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-accent text-muted-foreground border border-border'}`}>
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
                                                                    className="text-xs text-blue-600 dark:text-blue-600 hover:text-blue-600/80 font-medium flex items-center transition-colors"
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

                {/* Mobile Card View for SIPs */}
                <div className="md:hidden space-y-4">
                    {sips.map((sip, idx) => {
                        const isExpanded = expandedSipId === sip.sipId;
                        const nextDate = sip.nextInstalmentDate ? new Date(sip.nextInstalmentDate) : null;
                        const isActive = sip.status === 'ACTIVE';

                        return (
                            <div key={sip.sipId || idx} className="bg-accent rounded-xl p-4 border border-border">
                                <div
                                    className="flex justify-between items-start mb-2 cursor-pointer"
                                    onClick={() => toggleExpand(sip.sipId)}
                                >
                                    <div className="flex-1 mr-2">
                                        <h3 className="font-bold text-foreground text-base leading-snug">{sip.fund}</h3>
                                        <div className="text-[10px] text-gray-400 mt-1 break-all">
                                            {sip.tradingSymbol} {sip.folio && `| ${sip.folio}`}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${sip.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                            sip.status === 'PAUSED' ? 'bg-amber-50 text-amber-700' :
                                                'bg-red-50 text-red-700'
                                            }`}>
                                            {sip.status}
                                        </span>
                                        {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-border">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Amount</div>
                                        <div className="font-bold text-foreground">{formatCurrency(sip.instalmentAmount)}</div>
                                        <div className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">{sip.frequency}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Next Due</div>
                                        <div className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {nextDate ? nextDate.toLocaleDateString() : '-'}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">Day {sip.instalmentDay || '?'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Paid</div>
                                        <div className="font-medium text-muted-foreground">{sip.completedInstalments}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">ID</div>
                                        <div className="font-mono text-xs text-muted-foreground">{sip.sipId}</div>
                                    </div>
                                </div>

                                {/* Mobile Expanded History */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-border animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                                            <History size={14} className="text-blue-600" />
                                            <h3>Execution History</h3>
                                        </div>

                                        {!sip.executions || sip.executions.length === 0 ? (
                                            <div className="text-muted-foreground italic text-sm py-2 text-center bg-accent rounded-lg">No execution history available.</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {sip.executions.map((exec, eIdx) => (
                                                    <div key={exec.orderId || eIdx} className="bg-card p-3 rounded-lg border border-border text-sm">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="font-medium text-foreground">
                                                                    {formatCurrency(exec.amount)}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {exec.executionDate ? new Date(exec.executionDate).toLocaleDateString() :
                                                                        exec.orderTimestamp ? new Date(exec.orderTimestamp).toLocaleDateString() : '-'}
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${exec.status === 'COMPLETE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-accent text-muted-foreground border border-border'}`}>
                                                                {exec.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                                                            <span>NAV: {exec.executedNav ? `₹${exec.executedNav}` : '-'}</span>
                                                            <span className="font-mono text-[10px]">#{exec.orderId}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {onNavigate && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigate('timeline', { sipId: sip.sipId, highlightSipId: sip.sipId });
                                                }}
                                                className="w-full mt-4 py-2 text-xs text-blue-600 dark:text-blue-600 bg-blue-50 hover:bg-blue-600/15 rounded-lg font-medium flex items-center justify-center transition-colors"
                                            >
                                                View SIP history in Timeline <ChevronRight size={12} className="ml-1" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Unlinked SIP Orders Section (Orphaned) */}
            {unlinkedOrders && unlinkedOrders.length > 0 && (
                <div className="mt-8 pt-8 border-t border-dashed border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Unlinked Executions</h3>
                            <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-medium border border-amber-200">
                                {unlinkedOrders.length} Orphans
                            </span>
                        </div>
                    </div>

                    <div className="hidden md:block overflow-hidden rounded-xl border border-amber-200 shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-amber-50 text-xs font-medium text-amber-700 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Fund Name</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-right">NAV</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Order Ref</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-warning/20 bg-card">
                                {unlinkedOrders.map((order, idx) => (
                                    <tr key={order.orderId || idx} className="hover:bg-amber-50 transition-colors">
                                        <td className="px-4 py-3 text-foreground font-medium">
                                            {order.executionDate ? new Date(order.executionDate).toLocaleDateString() :
                                                order.orderTimestamp ? new Date(order.orderTimestamp).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground max-w-md truncate" title={order.fund}>
                                            {order.fund}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">
                                            {formatCurrency(order.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {order.executedNav ? `₹${order.executedNav}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'COMPLETE' ? 'bg-green-50 text-green-700' : 'bg-accent text-muted-foreground'}`}>
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

                    {/* Mobile Card View for Unlinked Orders */}
                    <div className="md:hidden space-y-3">
                        {unlinkedOrders.map((order, idx) => (
                            <div key={order.orderId || idx} className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 mr-2">
                                        <h3 className="font-bold text-foreground text-sm leading-snug">{order.fund}</h3>
                                    </div>
                                    <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'COMPLETE' ? 'bg-green-50 text-green-700' : 'bg-accent text-muted-foreground'}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-amber-200">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Amount</div>
                                        <div className="font-bold text-foreground">{formatCurrency(order.amount)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</div>
                                        <div className="font-medium text-foreground text-xs">
                                            {order.executionDate ? new Date(order.executionDate).toLocaleDateString() :
                                                order.orderTimestamp ? new Date(order.orderTimestamp).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">NAV</div>
                                        <div className="text-muted-foreground">{order.executedNav ? `₹${order.executedNav}` : '-'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Ref</div>
                                        <div className="font-mono text-xs text-muted-foreground">{order.orderId}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
