'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import {
    AlertCircle,
    ArrowDown,
    ArrowDownRight,
    ArrowUp,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    Clock,
    PauseCircle,
    PlayCircle,
    Search,
    TrendingDown,
    TrendingUp,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const eventTheme = (type) => {
    if (!type) return { color: 'text-muted-foreground', accent: 'border-muted-foreground', icon: CircleDollarSign };
    if (type.includes('BUY') || type === 'SIP_STATUS_ACTIVE') {
        return { color: 'text-[hsl(var(--gain))]', accent: 'border-[hsl(var(--gain))]', icon: TrendingUp };
    }
    if (type.includes('SELL') || type === 'REDEMPTION_COMPLETED' || type === 'SIP_STATUS_CANCELLED') {
        return { color: 'text-[hsl(var(--loss))]', accent: 'border-[hsl(var(--loss))]', icon: type === 'SIP_STATUS_CANCELLED' ? XCircle : TrendingDown };
    }
    if (type === 'SIP_CREATED' || type === 'SIP_EXECUTION_SCHEDULED') {
        return { color: 'text-[hsl(var(--neutral))]', accent: 'border-[hsl(var(--neutral))]', icon: type === 'SIP_EXECUTION_SCHEDULED' ? Clock : PlayCircle };
    }
    if (type === 'SIP_STATUS_PAUSED') {
        return { color: 'text-[hsl(var(--chart-4))]', accent: 'border-[hsl(var(--chart-4))]', icon: PauseCircle };
    }
    if (type.includes('HOLDING')) {
        return { color: 'text-[hsl(var(--neutral))]', accent: 'border-[hsl(var(--neutral))]', icon: type === 'HOLDING_INCREASED' ? ArrowUpRight : ArrowDownRight };
    }
    return { color: 'text-muted-foreground', accent: 'border-border', icon: AlertCircle };
};

const formatTitle = (type) => {
    if (!type) return 'Activity';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const eventBucket = (type = '') => {
    if (type.includes('BUY')) return 'BUY';
    if (type.includes('SELL') || type === 'REDEMPTION_COMPLETED') return 'SELL';
    if (type.startsWith('SIP_')) return 'SIP';
    if (type.includes('HOLDING')) return 'HOLDING';
    return 'OTHER';
};

const FILTERS = [
    { id: 'ALL',     label: 'All' },
    { id: 'BUY',     label: 'Buys' },
    { id: 'SELL',    label: 'Sells' },
    { id: 'SIP',     label: 'SIP' },
    { id: 'HOLDING', label: 'Holdings' },
];

export default function MfTimeline({ events, isLoading, onNavigate, initialContext }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [sortDir, setSortDir] = useState('desc');
    const [highlighted, setHighlighted] = useState(initialContext?.highlightSipId || null);
    const [expandedKey, setExpandedKey] = useState(null);

    useEffect(() => {
        if (initialContext?.highlightSipId) {
            setHighlighted(initialContext.highlightSipId);
            setFilter('ALL');
        }
    }, [initialContext]);

    // Bucket counts (computed from unfiltered events)
    const bucketCounts = useMemo(() => {
        const counts = { ALL: events?.length || 0, BUY: 0, SELL: 0, SIP: 0, HOLDING: 0 };
        (events || []).forEach(e => {
            const b = eventBucket(e.eventType);
            if (counts[b] != null) counts[b]++;
        });
        return counts;
    }, [events]);

    const filtered = useMemo(() => {
        if (!events) return [];
        let list = events;

        if (filter !== 'ALL') {
            list = list.filter(e => eventBucket(e.eventType) === filter);
        }

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(e =>
                (e.fund || '').toLowerCase().includes(q) ||
                (e.eventType || '').toLowerCase().includes(q) ||
                (e.sipId || '').toLowerCase().includes(q)
            );
        }

        if (highlighted) {
            list = list.filter(e => e.sipId === highlighted);
        }

        const sorted = [...list].sort((a, b) => {
            const ad = new Date(a.eventDate || a.timestamp || a.date || 0).getTime();
            const bd = new Date(b.eventDate || b.timestamp || b.date || 0).getTime();
            return sortDir === 'desc' ? bd - ad : ad - bd;
        });
        return sorted;
    }, [events, filter, search, highlighted, sortDir]);

    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach(e => {
            const d = e.eventDate || e.timestamp || e.date;
            const key = d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'Undated';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(e);
        });
        return Array.from(map.entries());
    }, [filtered]);

    if (isLoading) {
        return (
            <div className="ed-card py-14 flex items-center justify-center">
                <div className="h-6 w-6 border-2 border-border border-t-[hsl(var(--accent))] rounded-full animate-spin" />
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <section className="ed-card relative px-8 py-14 text-center">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-serif italic text-[20px] text-foreground">No timeline events on record.</p>
            </section>
        );
    }

    const clearAll = () => {
        setSearch('');
        setFilter('ALL');
        setHighlighted(null);
        setExpandedKey(null);
    };

    return (
        <div className="space-y-5">
            {/* Highlighted SIP banner */}
            {highlighted && (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent-muted))]/40">
                    <p className="text-[12px] text-foreground">
                        <span className="eyebrow mr-2">Focus</span>
                        <span className="font-mono tnum">SIP {highlighted}</span>
                    </p>
                    <button
                        onClick={() => setHighlighted(null)}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-3 w-3" /> Clear
                    </button>
                </div>
            )}

            {/* Filter bar */}
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-4 border-b border-border">
                <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex items-center gap-2 min-w-[240px]">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by fund, type, SIP id…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="ed-input text-[13px] py-1 w-64"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="eyebrow mr-1">Type</span>
                        {FILTERS.map(f => {
                            const active = filter === f.id;
                            const count = bucketCounts[f.id] || 0;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={cn(
                                        'h-6 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] border transition-colors rounded-sm inline-flex items-center gap-1.5',
                                        active
                                            ? 'bg-foreground text-background border-foreground'
                                            : 'border-border text-muted-foreground hover:text-foreground hover:border-hairline'
                                    )}
                                >
                                    {f.label}
                                    <span className={cn(
                                        'font-mono tnum text-[9px]',
                                        active ? 'text-background/70' : 'text-muted-foreground/70'
                                    )}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                        className="h-6 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] border border-border rounded-sm inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:border-hairline transition-colors"
                        title="Toggle sort direction"
                    >
                        {sortDir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                        {sortDir === 'desc' ? 'Newest' : 'Oldest'}
                    </button>

                    {(search || filter !== 'ALL' || highlighted) && (
                        <button
                            onClick={clearAll}
                            className="h-6 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--loss))] hover:underline transition-colors inline-flex items-center gap-1"
                        >
                            <X className="h-3 w-3" /> Reset
                        </button>
                    )}
                </div>
                <span className="text-[11px] tabular-nums font-mono text-muted-foreground">
                    {filtered.length} of {events.length} events
                </span>
            </div>

            {/* Timeline */}
            {filtered.length === 0 ? (
                <section className="ed-card relative px-8 py-14 text-center">
                    <span className="corner-mark corner-tl" />
                    <span className="corner-mark corner-br" />
                    <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-serif italic text-[20px] text-foreground">No events match the current filters.</p>
                    <button onClick={clearAll} className="ed-btn ed-btn-ghost mt-4">
                        <X className="h-3 w-3" /> Reset filters
                    </button>
                </section>
            ) : (
                <section className="ed-card relative">
                    <span className="corner-mark corner-tl" />
                    <span className="corner-mark corner-br" />

                    {grouped.map(([month, items], gi) => (
                        <div key={month} className={gi === 0 ? '' : 'border-t border-hairline'}>
                            <div className="px-6 py-3 border-b border-border bg-muted/40 flex items-baseline gap-3">
                                <span className="index-num tnum">[ {String(gi + 1).padStart(2, '0')} ]</span>
                                <h4 className="font-serif text-[18px] italic text-foreground leading-none">{month}</h4>
                                <span className="ml-auto eyebrow tnum">{items.length} entries</span>
                            </div>
                            <ul>
                                {items.map((e, ei) => {
                                    const theme = eventTheme(e.eventType);
                                    const Icon = theme.icon;
                                    const date = e.eventDate || e.timestamp || e.date;
                                    const isHighlight = highlighted && e.sipId === highlighted;
                                    const key = `${month}-${ei}-${e.sipId || e.eventType}`;
                                    const isOpen = expandedKey === key;
                                    const isLast = ei === items.length - 1;
                                    const hasDetail = !!(e.fund || e.amount != null || e.quantity != null || e.sipId);

                                    return (
                                        <li key={key}>
                                            <button
                                                type="button"
                                                onClick={() => hasDetail && setExpandedKey(isOpen ? null : key)}
                                                className={cn(
                                                    'w-full text-left flex gap-4 px-6 py-4 transition-colors',
                                                    !isLast && 'border-b border-border',
                                                    isHighlight && 'bg-[hsl(var(--accent-muted))]/40 border-l-2 border-l-[hsl(var(--accent))]',
                                                    hasDetail && 'hover:bg-[hsl(var(--accent-muted))]/30 cursor-pointer',
                                                    !hasDetail && 'cursor-default'
                                                )}
                                            >
                                                <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                                                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-sm border', theme.accent, theme.color)}>
                                                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                                                    </span>
                                                    {!isLast && <span className="flex-1 w-px bg-border mt-1 min-h-[12px]" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-3 mb-1">
                                                        <p className={cn('text-[13px] font-semibold tracking-tight inline-flex items-center gap-2', theme.color)}>
                                                            {formatTitle(e.eventType)}
                                                            {hasDetail && (
                                                                isOpen ? <ChevronDown className="h-3 w-3 opacity-60" /> : <ChevronRight className="h-3 w-3 opacity-60" />
                                                            )}
                                                        </p>
                                                        <p className="font-mono tnum text-[11px] text-muted-foreground flex-shrink-0">
                                                            {date ? new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                        </p>
                                                    </div>
                                                    {e.fund && (
                                                        <p className="text-[12px] text-foreground line-clamp-1">{e.fund}</p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
                                                        {e.amount != null && (
                                                            <span className="font-mono tnum">{formatCurrency(e.amount)}</span>
                                                        )}
                                                        {e.quantity != null && (
                                                            <span className="font-mono tnum">{Number(e.quantity).toFixed(3)} units</span>
                                                        )}
                                                        {e.sipId && (
                                                            <span className="font-mono tnum">SIP {e.sipId}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>

                                            {hasDetail && isOpen && (
                                                <div className="ml-[3.25rem] mr-6 mb-4 px-4 py-3 bg-muted/40 border-l-2 border-[hsl(var(--accent))]/50 rounded-r-sm">
                                                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                                                        {e.fund && (
                                                            <div className="col-span-2 sm:col-span-4">
                                                                <dt className="eyebrow mb-1">Fund</dt>
                                                                <dd className="text-foreground font-serif">{e.fund}</dd>
                                                            </div>
                                                        )}
                                                        {e.amount != null && (
                                                            <div>
                                                                <dt className="eyebrow mb-1">Amount</dt>
                                                                <dd className="font-mono tnum text-foreground font-medium">{formatCurrency(e.amount)}</dd>
                                                            </div>
                                                        )}
                                                        {e.quantity != null && (
                                                            <div>
                                                                <dt className="eyebrow mb-1">Units</dt>
                                                                <dd className="font-mono tnum text-foreground font-medium">{Number(e.quantity).toFixed(3)}</dd>
                                                            </div>
                                                        )}
                                                        {e.nav != null && (
                                                            <div>
                                                                <dt className="eyebrow mb-1">NAV</dt>
                                                                <dd className="font-mono tnum text-foreground font-medium">₹{e.nav}</dd>
                                                            </div>
                                                        )}
                                                        {e.sipId && (
                                                            <div>
                                                                <dt className="eyebrow mb-1">SIP ID</dt>
                                                                <dd className="font-mono tnum text-foreground">{e.sipId}</dd>
                                                            </div>
                                                        )}
                                                        {e.orderId && (
                                                            <div className="col-span-2">
                                                                <dt className="eyebrow mb-1">Order Ref</dt>
                                                                <dd className="font-mono text-[10px] text-muted-foreground">{e.orderId}</dd>
                                                            </div>
                                                        )}
                                                    </dl>
                                                    {(e.sipId || onNavigate) && (
                                                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                                                            {e.sipId && !highlighted && (
                                                                <button
                                                                    onClick={(ev) => { ev.stopPropagation(); setHighlighted(e.sipId); }}
                                                                    className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[hsl(var(--accent))] hover:underline"
                                                                >
                                                                    Focus this SIP
                                                                </button>
                                                            )}
                                                            {e.sipId && onNavigate && (
                                                                <button
                                                                    onClick={(ev) => { ev.stopPropagation(); onNavigate('mf_sips', { expandSipId: e.sipId }); }}
                                                                    className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                                                >
                                                                    Open in SIPs <ChevronRight className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
