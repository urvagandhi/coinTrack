// src/components/portfolio/tabs/HoldingsTab.jsx
'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { usePortfolioHoldings } from '@/hooks/usePortfolioHoldings';
import { formatCurrency, formatPercent } from '@/lib/format';
import { containerVariants, tableRowVariants, useMotionVariants } from '@/lib/motion';
import { getShortCompanyName } from '@/lib/stockNameMapping';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BarChart2, ChevronDown, ChevronUp, Info, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TabError } from './TabError';

const BROKER_DISPLAY = { ZERODHA: 'Zerodha', ANGEL_ONE: 'Angel One', UPSTOX: 'Upstox', GROWW: 'Groww' };
const BROKER_BADGE = {
    ZERODHA: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ANGEL_ONE: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    UPSTOX: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    GROWW: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};
const TH = 'px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors';
const PAGE_SIZE = 20;

function SortIcon({ column, sortKey, sortDir }) {
    if (sortKey !== column) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />;
}

export function HoldingsTab() {
    const { data: rawData, isLoading, error, refetch } = usePortfolioHoldings();
    const container = useMotionVariants(containerVariants);
    const [search, setSearch] = useState('');
    const [selectedBrokers, setSelectedBrokers] = useState([]);
    const [sortKey, setSortKey] = useState('currentValue');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(0);

    const holdings = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    const availableBrokers = useMemo(() => {
        const set = new Set();
        holdings.forEach(h => { const b = h.broker || h.brokerType; if (b) set.add(b); });
        return Array.from(set);
    }, [holdings]);

    const toggleBroker = (b) => {
        setSelectedBrokers(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
        setPage(0);
    };

    const filtered = useMemo(() => {
        let result = holdings;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(h =>
                (h.symbol || '').toLowerCase().includes(q) ||
                (getShortCompanyName(h.symbol) || '').toLowerCase().includes(q)
            );
        }
        if (selectedBrokers.length > 0) {
            result = result.filter(h => selectedBrokers.includes(h.broker || h.brokerType));
        }
        return result;
    }, [holdings, search, selectedBrokers]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const aVal = a[sortKey] ?? 0;
            const bVal = b[sortKey] ?? 0;
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    if (error) return <TabError error={error} onRetry={refetch} />;

    const hasT1 = holdings.some(h => h.t1Quantity > 0);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text" placeholder="Search holdings..." value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            className="pl-8 pr-3 h-8 text-sm bg-background border border-border rounded-lg w-48 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-foreground placeholder:text-gray-400 transition-colors"
                        />
                    </div>
                    {availableBrokers.map(b => (
                        <button key={b} onClick={() => toggleBroker(b)} className={cn(
                            'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors',
                            selectedBrokers.includes(b) ? 'bg-blue-600 text-white' : 'border border-border text-muted-foreground hover:text-foreground'
                        )}>
                            {BROKER_DISPLAY[b] || b}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">{filtered.length} holdings</span>
            </div>

            {/* Table */}
            <motion.div variants={container} initial="hidden" animate="visible" className="bg-card border border-border rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16 ml-auto" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
                        ))}
                    </div>
                ) : holdings.length === 0 ? (
                    <div className="py-12 text-center">
                        <BarChart2 size={32} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No holdings found</p>
                        <p className="text-xs text-gray-400 mt-1">Connect a broker to start tracking</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted">
                                        <th className={cn(TH, 'text-left')} onClick={() => handleSort('symbol')}>Stock <SortIcon column="symbol" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className={cn(TH, 'text-left')}>Broker</th>
                                        <th className={cn(TH, 'text-right')} onClick={() => handleSort('quantity')}>Qty <SortIcon column="quantity" sortKey={sortKey} sortDir={sortDir} /></th>
                                        {hasT1 && <th className={cn(TH, 'text-right')}>T1</th>}
                                        <th className={cn(TH, 'text-right')} onClick={() => handleSort('averageBuyPrice')}>Avg Price <SortIcon column="averageBuyPrice" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className={cn(TH, 'text-right')}>Current</th>
                                        <th className={cn(TH, 'text-right')} onClick={() => handleSort('currentValue')}>Value <SortIcon column="currentValue" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className={cn(TH, 'text-right')} onClick={() => handleSort('unrealizedPL')}>P&L <SortIcon column="unrealizedPL" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className={cn(TH, 'text-right')}>Day</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((h, i) => {
                                        const broker = h.broker || h.brokerType;
                                        const pnl = h.unrealizedPL ?? h.unrealizedPnL ?? 0;
                                        const pnlPct = h.unrealizedPLPercent ?? h.unrealizedPnLPct ?? 0;
                                        const dayChange = h.dayGain ?? h.dayChange;
                                        const dayPct = h.dayGainPercent ?? h.dayChangePct;
                                        const pnlPos = pnl >= 0;
                                        const dayPos = (dayChange ?? 0) >= 0;
                                        const stockName = getShortCompanyName(h.symbol);
                                        const rowV = useMotionVariants(tableRowVariants);

                                        return (
                                            <motion.tr key={`${h.symbol}-${broker}-${i}`} custom={i} variants={rowV} initial="hidden" animate="visible"
                                                className="border-b border-border last:border-b-0 hover:bg-accent transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-foreground">{stockName || h.symbol}</span>
                                                        {stockName && stockName !== h.symbol && <span className="text-xs text-muted-foreground mt-0.5">{h.symbol}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', BROKER_BADGE[broker] || 'bg-accent text-muted-foreground')}>
                                                        {BROKER_DISPLAY[broker] || broker}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-sm text-foreground">{h.quantity}</td>
                                                {hasT1 && (
                                                    <td className="px-4 py-3.5 text-right text-sm" title="Unsettled shares — not available for trading">
                                                        {h.t1Quantity > 0 ? <span className="text-amber-700">{h.t1Quantity}</span> : <span className="text-gray-400">&mdash;</span>}
                                                    </td>
                                                )}
                                                <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">{formatCurrency(h.averageBuyPrice ?? h.avgBuyPrice, { precise: true })}</td>
                                                <td className="px-4 py-3.5 text-right text-sm text-foreground font-medium">{h.currentPrice > 0 ? formatCurrency(h.currentPrice) : '\u2014'}</td>
                                                <td className="px-4 py-3.5 text-right text-sm text-foreground font-semibold">{formatCurrency(h.currentValue)}</td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={cn('text-sm font-medium flex items-center gap-1', pnlPos ? 'text-green-600' : 'text-red-600')}>
                                                            {formatCurrency(pnl, { showSign: true })}
                                                            {h.dataConfidence === 'LOW' && <span title="Average price may be inaccurate"><Info size={11} className="text-gray-400" /></span>}
                                                        </span>
                                                        <span className={cn('text-xs', pnlPos ? 'text-green-600' : 'text-red-600')}>{formatPercent(pnlPct, { showSign: true })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {dayChange != null ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className={cn('text-xs font-medium', dayPos ? 'text-green-600' : 'text-red-600')}>{formatPercent(dayPct, { showSign: true })}</span>
                                                            <span className={cn('text-[10px] mt-0.5', dayPos ? 'text-green-600' : 'text-red-600')}>{formatCurrency(dayChange, { showSign: true })}</span>
                                                        </div>
                                                    ) : <span className="text-gray-400">&mdash;</span>}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                        className="w-8 h-8 rounded-lg text-sm border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">&lt;</button>
                                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                        const p = page < 3 ? i : page - 2 + i;
                                        if (p >= totalPages) return null;
                                        return (
                                            <button key={p} onClick={() => setPage(p)} className={cn(
                                                'w-8 h-8 rounded-lg text-sm transition-colors',
                                                p === page ? 'bg-blue-600 text-white' : 'border border-border text-muted-foreground hover:bg-accent'
                                            )}>{p + 1}</button>
                                        );
                                    })}
                                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                        className="w-8 h-8 rounded-lg text-sm border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">&gt;</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
}
