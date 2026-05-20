'use client';

import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, History, PiggyBank } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';

const STATUS_STYLE = {
    ACTIVE:    'text-[hsl(var(--gain))] border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/8',
    PAUSED:    'text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30 bg-[hsl(var(--chart-4))]/10',
    CANCELLED: 'text-[hsl(var(--loss))] border-[hsl(var(--loss))]/30 bg-[hsl(var(--loss))]/8',
};

export default function MfSipList({ sips, unlinkedOrders, isLoading, onNavigate, initialContext }) {
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        if (initialContext?.expandSipId && sips) {
            const found = sips.find(s => s.sipId === initialContext.expandSipId);
            if (found) setExpanded(initialContext.expandSipId);
        }
    }, [initialContext, sips]);

    if (isLoading) {
        return (
            <div className="ed-card py-14 flex items-center justify-center">
                <div className="h-6 w-6 border-2 border-border border-t-[hsl(var(--accent))] rounded-full animate-spin" />
            </div>
        );
    }

    if (!sips || sips.length === 0) {
        return (
            <section className="ed-card relative px-8 py-14 text-center">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                <PiggyBank className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-serif italic text-[20px] text-foreground">No active SIPs.</p>
                <p className="text-[12px] text-muted-foreground mt-1">Connect Zerodha Coin to begin tracking systematic plans.</p>
            </section>
        );
    }

    return (
        <div className="space-y-5">
            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />

                <header className="px-6 py-5 border-b border-hairline flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                        <span className="index-num tnum">[ §05.3 ]</span>
                        <h3 className="font-serif text-[20px] text-foreground leading-none">Systematic Plans</h3>
                        <span className="eyebrow ml-2 tnum">{sips.length} active</span>
                    </div>
                </header>

                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="ed-table">
                        <thead>
                            <tr>
                                <th className="w-8 pl-6"></th>
                                <th className="text-left">Fund</th>
                                <th className="text-right">Amount</th>
                                <th className="text-right">Schedule</th>
                                <th className="text-right">Progress</th>
                                <th className="text-right pr-6">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sips.map((sip, idx) => {
                                const isExpanded = expanded === sip.sipId;
                                const next = sip.nextInstalmentDate ? new Date(sip.nextInstalmentDate) : null;

                                return (
                                    <Fragment key={sip.sipId || idx}>
                                        <tr
                                            className={cn('cursor-pointer', isExpanded && 'bg-[hsl(var(--accent-muted))]/30')}
                                            onClick={() => setExpanded(isExpanded ? null : sip.sipId)}
                                        >
                                            <td className="pl-6 w-8">
                                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--accent))]" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                            </td>
                                            <td>
                                                <p className="font-medium text-foreground text-[13px] tracking-tight line-clamp-1" title={sip.fund}>{sip.fund}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">
                                                    {sip.folio || '—'} · {sip.tradingSymbol || '—'} · ID {sip.sipId}
                                                </p>
                                            </td>
                                            <td className="text-right">
                                                <p className="font-mono tnum text-foreground font-medium">{formatCurrency(sip.instalmentAmount)}</p>
                                                <p className="eyebrow mt-0.5">{sip.frequency}</p>
                                            </td>
                                            <td className="text-right">
                                                <p className="font-mono tnum text-[12px]">{next ? next.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">Day {sip.instalmentDay || '—'}</p>
                                            </td>
                                            <td className="text-right">
                                                <p className="font-mono tnum text-foreground font-medium">{sip.completedInstalments}<span className="text-muted-foreground text-[11px]"> paid</span></p>
                                                {sip.totalInstalments > 0 && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">of {sip.totalInstalments}</p>
                                                )}
                                            </td>
                                            <td className="text-right pr-6">
                                                <span className={cn(
                                                    'inline-block text-[9px] tracking-[0.1em] uppercase font-semibold px-1.5 py-0.5 rounded-sm border',
                                                    STATUS_STYLE[sip.status] || 'text-muted-foreground border-border bg-muted'
                                                )}>{sip.status}</span>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="6" className="bg-muted/50 px-6 py-5 border-y border-hairline">
                                                    <div className="ml-2 pl-4 border-l-2 border-[hsl(var(--accent))]/40">
                                                        <div className="flex items-center gap-2 mb-4 eyebrow-strong">
                                                            <History className="h-3 w-3 text-[hsl(var(--accent))]" />
                                                            Execution History
                                                        </div>
                                                        {!sip.executions || sip.executions.length === 0 ? (
                                                            <p className="text-[12px] font-serif italic text-muted-foreground py-2">No execution history available.</p>
                                                        ) : (
                                                            <table className="w-full text-[12px]">
                                                                <thead>
                                                                    <tr className="text-muted-foreground">
                                                                        <th className="text-left pb-2 font-medium uppercase tracking-[0.1em] text-[10px]">Date</th>
                                                                        <th className="text-right pb-2 font-medium uppercase tracking-[0.1em] text-[10px]">Amount</th>
                                                                        <th className="text-right pb-2 font-medium uppercase tracking-[0.1em] text-[10px]">NAV</th>
                                                                        <th className="text-center pb-2 font-medium uppercase tracking-[0.1em] text-[10px]">Status</th>
                                                                        <th className="text-right pb-2 font-medium uppercase tracking-[0.1em] text-[10px]">Order Ref</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sip.executions.map((exec, eIdx) => (
                                                                        <tr key={exec.orderId || eIdx} className="border-t border-border">
                                                                            <td className="py-2 text-foreground font-mono tnum">
                                                                                {exec.executionDate ? new Date(exec.executionDate).toLocaleDateString() :
                                                                                    exec.orderTimestamp ? new Date(exec.orderTimestamp).toLocaleDateString() : '—'}
                                                                            </td>
                                                                            <td className="py-2 text-right font-mono tnum text-foreground">{formatCurrency(exec.amount)}</td>
                                                                            <td className="py-2 text-right font-mono tnum text-muted-foreground">{exec.executedNav ? `₹${exec.executedNav}` : '—'}</td>
                                                                            <td className="py-2 text-center">
                                                                                <span className={cn(
                                                                                    'inline-block text-[9px] tracking-[0.1em] uppercase font-semibold px-1.5 py-0.5 rounded-sm border',
                                                                                    exec.status === 'COMPLETE'
                                                                                        ? 'text-[hsl(var(--gain))] border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/8'
                                                                                        : 'text-muted-foreground border-border bg-muted'
                                                                                )}>{exec.status}</span>
                                                                            </td>
                                                                            <td className="py-2 text-right font-mono text-[10px] text-muted-foreground/70">{exec.orderId}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                        {onNavigate && (
                                                            <div className="mt-4 text-right">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onNavigate('timeline', { sipId: sip.sipId, highlightSipId: sip.sipId }); }}
                                                                    className="ed-link text-[11px] inline-flex items-center gap-1"
                                                                >
                                                                    See SIP history in Timeline
                                                                    <ChevronRight className="h-3 w-3" />
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

                {/* Mobile */}
                <div className="md:hidden divide-y divide-border">
                    {sips.map((sip, idx) => {
                        const isExpanded = expanded === sip.sipId;
                        const next = sip.nextInstalmentDate ? new Date(sip.nextInstalmentDate) : null;
                        return (
                            <div key={sip.sipId || idx} className="px-5 py-4">
                                <button
                                    onClick={() => setExpanded(isExpanded ? null : sip.sipId)}
                                    className="w-full text-left"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground text-[13px] line-clamp-2">{sip.fund}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">{sip.tradingSymbol} · {sip.folio || '—'}</p>
                                        </div>
                                        <span className={cn(
                                            'inline-block text-[9px] tracking-[0.1em] uppercase font-semibold px-1.5 py-0.5 rounded-sm border flex-shrink-0',
                                            STATUS_STYLE[sip.status] || 'text-muted-foreground border-border'
                                        )}>{sip.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-[12px] pt-3 border-t border-border">
                                        <div>
                                            <p className="eyebrow mb-1">Amount</p>
                                            <p className="font-mono tnum text-foreground font-medium">{formatCurrency(sip.instalmentAmount)}</p>
                                            <p className="eyebrow mt-0.5">{sip.frequency}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="eyebrow mb-1">Next Due</p>
                                            <p className="font-mono tnum">{next ? next.toLocaleDateString() : '—'}</p>
                                            <p className="eyebrow mt-0.5">Day {sip.instalmentDay || '—'}</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {unlinkedOrders && unlinkedOrders.length > 0 && (
                <section className="ed-card relative px-6 py-5">
                    <span className="corner-mark corner-tl" />
                    <span className="corner-mark corner-br" />
                    <div className="flex items-baseline gap-3 mb-2">
                        <span className="index-num tnum">[ ※ ]</span>
                        <h3 className="font-serif text-[16px] text-foreground leading-none">Unlinked SIP Orders</h3>
                    </div>
                    <p className="text-[12px] text-muted-foreground font-serif italic">
                        {unlinkedOrders.length} order{unlinkedOrders.length !== 1 ? 's' : ''} could not be matched to an active SIP plan.
                    </p>
                </section>
            )}
        </div>
    );
}
