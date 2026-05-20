'use client';

import { cn } from '@/lib/utils';
import { Banknote, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function MfInstrumentList({ instruments, isLoading }) {
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const filtered = useMemo(() => {
        if (!instruments) return [];
        if (!search) return instruments.slice(0, 50);
        const q = search.toLowerCase();
        return instruments.filter(inst =>
            (inst.name && inst.name.toLowerCase().includes(q)) ||
            (inst.amc && inst.amc.toLowerCase().includes(q)) ||
            (inst.schemeType && inst.schemeType.toLowerCase().includes(q)) ||
            (inst.tradingSymbol && inst.tradingSymbol.toLowerCase().includes(q))
        ).slice(0, 50);
    }, [instruments, search]);

    const parsePlan = (inst) => {
        let type = inst.schemeType || inst.scheme_type || 'Unknown';
        let plan = inst.plan || 'Regular';
        if (type && type.toLowerCase().includes('direct')) {
            plan = 'Direct';
            type = type.replace(/direct/i, '').trim();
        } else if (type && type.toLowerCase().includes('regular')) {
            plan = 'Regular';
            type = type.replace(/regular/i, '').trim();
        }
        if (type) type = type.charAt(0).toUpperCase() + type.slice(1);
        return { type, plan };
    };

    if (isLoading) {
        return (
            <div className="ed-card py-14 flex items-center justify-center">
                <div className="h-6 w-6 border-2 border-border border-t-[hsl(var(--accent))] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-end justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2 min-w-[260px]">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by fund name, AMC, scheme type…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="ed-input text-[13px] py-1 w-72"
                    />
                </div>
                <span className="text-[11px] tabular-nums font-mono text-muted-foreground">
                    Showing {filtered.length}
                    {instruments && instruments.length > filtered.length && ` of ${instruments.length}`}
                </span>
            </div>

            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                {filtered.length === 0 ? (
                    <div className="py-14 text-center">
                        <Banknote className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                        <p className="font-serif italic text-[20px] text-foreground">No instruments matched.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {filtered.map((inst, i) => {
                            const id = inst.tradingSymbol || inst.scheme || i;
                            const isOpen = expandedId === id;
                            const { type, plan } = parsePlan(inst);
                            return (
                                <li key={id}>
                                    <button
                                        onClick={() => setExpandedId(isOpen ? null : id)}
                                        className="w-full text-left px-6 py-3 flex items-center gap-4 hover:bg-[hsl(var(--accent-muted))]/30 transition-colors"
                                    >
                                        <span className="index-num tnum w-8">{String(i + 1).padStart(3, '0')}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-foreground tracking-tight line-clamp-1">{inst.name}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                                                <span>{inst.amc || '—'}</span>
                                                <span>·</span>
                                                <span>{type}</span>
                                                <span>·</span>
                                                <span className="text-[hsl(var(--accent))]">{plan}</span>
                                            </div>
                                        </div>
                                        {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--accent))]" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                    </button>
                                    {isOpen && (
                                        <div className="px-6 py-4 bg-muted/40 border-t border-border">
                                            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                                                <div>
                                                    <dt className="eyebrow mb-1">Symbol</dt>
                                                    <dd className="font-mono text-foreground">{inst.tradingSymbol || '—'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="eyebrow mb-1">Last NAV</dt>
                                                    <dd className="font-mono tnum text-foreground">{inst.lastPrice ? `₹${inst.lastPrice}` : '—'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="eyebrow mb-1">Min Invest</dt>
                                                    <dd className="font-mono tnum text-foreground">{inst.minimumPurchaseAmount ? `₹${inst.minimumPurchaseAmount}` : '—'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="eyebrow mb-1">Settlement</dt>
                                                    <dd className="font-mono text-foreground">{inst.settlementType || '—'}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
