'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Banknote,
    ChevronDown,
    ChevronUp,
    Clock,
    Info,
    Search,
    ShieldCheck,
    TrendingUp
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

export default function MfInstrumentList({ instruments, isLoading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const filteredInstruments = useMemo(() => {
        if (!instruments) return [];
        if (!searchTerm) return instruments.slice(0, 50); // Limit initial view for performance

        const lowerTerm = searchTerm.toLowerCase();
        return instruments.filter(inst =>
            (inst.name && inst.name.toLowerCase().includes(lowerTerm)) ||
            (inst.amc && inst.amc.toLowerCase().includes(lowerTerm)) ||
            (inst.schemeType && inst.schemeType.toLowerCase().includes(lowerTerm)) ||
            (inst.tradingSymbol && inst.tradingSymbol.toLowerCase().includes(lowerTerm))
        ).slice(0, 50); // Limit results
    }, [instruments, searchTerm]);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Helper to parse Scheme Type and Plan from merged string
    const parseSchemeAndPlan = (inst) => {
        let typeString = inst.schemeType || inst.scheme_type || 'Unknown';
        let planField = inst.plan || 'Regular';

        // Heuristic for known merged types in Zerodha
        let schemeType = typeString;
        let plan = planField;

        if (schemeType && schemeType.toLowerCase().includes('direct')) {
            plan = 'Direct';
            schemeType = schemeType.replace(/direct/i, '').trim();
        } else if (schemeType && schemeType.toLowerCase().includes('regular')) {
            plan = 'Regular';
            schemeType = schemeType.replace(/regular/i, '').trim();
        }

        // Capitalize
        if (schemeType) {
            schemeType = schemeType.charAt(0).toUpperCase() + schemeType.slice(1);
        }

        return { schemeType, plan };
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 4
        }).format(val);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search mutual funds by name or AMC..."
                    className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-muted text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {!instruments || instruments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No mutual fund instruments found.
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                                    <th className="pb-4 pl-4 pt-2">Scheme Name</th>
                                    <th className="pb-4 pt-2">AMC</th>
                                    <th className="pb-4 pt-2 text-right pr-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border">
                                {filteredInstruments.map((inst, idx) => {
                                    const symbol = inst.tradingSymbol || inst.tradingsymbol;
                                    const isExpanded = expandedId === symbol;
                                    const { schemeType, plan } = parseSchemeAndPlan(inst);

                                    return (
                                        <React.Fragment key={symbol || idx}>
                                            {/* Main Row */}
                                            <tr
                                                className={`group transition-colors cursor-pointer ${isExpanded ? 'bg-blue-600/5' : 'hover:bg-accent'}`}
                                                onClick={() => toggleExpand(symbol)}
                                            >
                                                <td className="py-4 pl-4">
                                                    <div className="font-medium text-foreground max-w-md truncate" title={inst.name}>
                                                        {inst.name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5 font-mono flex items-center gap-2">
                                                        <span>{symbol}</span>
                                                        <span className="bg-accent text-muted-foreground text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold">
                                                            {schemeType}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm text-muted-foreground">
                                                    {inst.amc || inst.fund_house || '-'}
                                                </td>
                                                <td className="py-4 text-right pr-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleExpand(symbol); }}
                                                        className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-accent'}`}
                                                    >
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Row */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <tr key={`${symbol}-details`}>
                                                        <td colSpan="4" className="p-0 border-0">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                                className="bg-accent border-b border-border overflow-hidden"
                                                            >
                                                                <MfInstrumentDetails inst={inst} symbol={symbol} plan={plan} schemeType={schemeType} formatCurrency={formatCurrency} formatDate={formatDate} />
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredInstruments.map((inst, idx) => {
                            const symbol = inst.tradingSymbol || inst.tradingsymbol;
                            const isExpanded = expandedId === symbol;
                            const { schemeType, plan } = parseSchemeAndPlan(inst);

                            return (
                                <div key={symbol || idx} className={`rounded-xl border transition-all duration-200 ${isExpanded ? 'border-blue-200 bg-blue-600/5 shadow-sm' : 'border-border bg-accent'}`}>
                                    <div
                                        className="p-4 flex justify-between items-start cursor-pointer"
                                        onClick={() => toggleExpand(symbol)}
                                    >
                                        <div className="flex-1 mr-4">
                                            <h3 className="font-bold text-foreground text-base leading-snug">{inst.name}</h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-mono text-gray-400">{symbol}</span>
                                                <span className="bg-card border border-border text-muted-foreground text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold">
                                                    {schemeType}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-2">{inst.amc || inst.fund_house || '-'}</div>
                                        </div>
                                        <button
                                            className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${isExpanded ? 'bg-blue-50 text-blue-600' : 'text-gray-400 bg-card'}`}
                                        >
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="border-t border-blue-200 overflow-hidden"
                                            >
                                                <MfInstrumentDetails inst={inst} symbol={symbol} plan={plan} schemeType={schemeType} formatCurrency={formatCurrency} formatDate={formatDate} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>

                    <div className="text-center text-xs text-gray-400 mt-4 pb-4">
                        Showing {filteredInstruments.length} of {instruments.length} instruments
                    </div>
                </div>
            )}
        </div>
    );
}

// Extracted Details Component
function MfInstrumentDetails({ inst, symbol, plan, schemeType, formatCurrency, formatDate }) {
    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* SECTION 1: Scheme Identity */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheme Identity</h4>
                </div>
                <div className="space-y-2">
                    <div>
                        <p className="text-[10px] text-gray-400">Trading Symbol</p>
                        <p className="text-sm font-mono font-medium text-muted-foreground">{symbol}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400">ISIN</p>
                        {inst.isin ? (
                            <p className="text-sm font-mono text-muted-foreground">{inst.isin}</p>
                        ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">
                                <AlertCircle size={10} />
                                ISIN: Not available (Zerodha)
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-[10px] text-gray-400">Plan</p>
                            <p className="text-sm font-medium text-muted-foreground">{plan}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400">Type</p>
                            <p className="text-sm font-medium text-muted-foreground">{schemeType}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400">Dividend</p>
                            <p className="text-sm font-medium text-muted-foreground capitalize">{inst.dividendType || inst.dividend_type || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Investment Rules */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Investment Rules</h4>
                </div>
                <div className="space-y-2">
                    <div>
                        <p className="text-[10px] text-gray-400">Min. Purchase Amount</p>
                        <p className="text-sm font-bold text-foreground">
                            {formatCurrency(inst.minimumPurchaseAmount || inst.minimum_purchase_amount)}
                        </p>
                        <p className="text-[9px] text-gray-400">
                            + {formatCurrency(inst.minimumAdditionalPurchaseAmount || inst.minimum_additional_purchase_amount)} (Add'l)
                        </p>
                        <p className="text-[9px] text-gray-400">
                            Multiples of {inst.purchaseAmountMultiplier || inst.purchase_amount_multiplier || '1'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400">Min. Redemption Qty</p>
                        <p className="text-sm font-medium text-muted-foreground">
                            {inst.minimumRedemptionQuantity || inst.minimum_redemption_quantity || '—'} Units
                        </p>
                        <p className="text-[9px] text-gray-400">
                            Multiples of {inst.redemptionQuantityMultiplier || inst.redemption_quantity_multiplier || '1'}
                        </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${(inst.purchaseAllowed) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <span className="text-[10px] font-bold uppercase">{(inst.purchaseAllowed) ? 'Buy Allowed' : 'Buy Locked'}</span>
                        </div>
                        <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${(inst.redemptionAllowed) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <span className="text-[10px] font-bold uppercase">{(inst.redemptionAllowed) ? 'Redeem Allowed' : 'Redeem Locked'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Pricing & Settlement */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pricing & Settlement</h4>
                </div>
                <div className="space-y-2">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Latest NAV</p>
                            <div className="group relative">
                                <Info size={10} className="text-gray-400 cursor-help" />
                                <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 w-48 bg-foreground text-background text-[10px] p-2 rounded shadow-lg z-20">
                                    Provided by broker (may be delayed)
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-lg font-bold text-foreground">
                                {formatCurrency(inst.lastPrice || inst.last_price)}
                            </p>
                            <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                                {inst.lastPriceDate ? formatDate(inst.lastPriceDate) : (inst.last_price_date ? formatDate(inst.last_price_date) : 'Date N/A')}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 italic flex items-center gap-1">
                            <Info size={10} /> Provided by broker (may be delayed)
                        </p>
                    </div>
                    <div className="pt-1">
                        <div>
                            <p className="text-[10px] text-gray-400">Settlement Type</p>
                            <p className="text-xs font-semibold text-muted-foreground">{inst.settlementType || inst.settlement_type || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 4: Actions (Mock Placeholders) */}
            <div className="space-y-3 flex flex-col justify-end">
                <div className="space-y-2">
                    {(inst.purchase_allowed || inst.purchaseAllowed) && (
                        <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                            Invest Now
                        </button>
                    )}
                    {(inst.sip_allowed || inst.sipAllowed) && (
                        <button className="w-full py-2 bg-white dark:bg-transparent border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Clock size={16} /> Start SIP
                        </button>
                    )}
                    {!(inst.purchase_allowed || inst.purchaseAllowed) && !(inst.sip_allowed || inst.sipAllowed) && (
                        <div className="text-center p-3 bg-accent rounded-lg border border-dashed border-border">
                            <p className="text-xs text-gray-400">Trading currently paused for this scheme.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
