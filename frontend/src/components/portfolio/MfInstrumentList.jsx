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
        let typeString = inst.schemeType || inst.scheme_type || inst.category || 'Unknown';
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                    placeholder="Search mutual funds by name, AMC, or category..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {!instruments || instruments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No mutual fund instruments found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                <th className="pb-4 pl-4 pt-2">Scheme Name</th>
                                <th className="pb-4 pt-2">AMC</th>
                                <th className="pb-4 pt-2">Category</th>
                                <th className="pb-4 pt-2 text-right pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredInstruments.map((inst, idx) => {
                                const symbol = inst.tradingSymbol || inst.tradingsymbol;
                                const isExpanded = expandedId === symbol;
                                const { schemeType, plan } = parseSchemeAndPlan(inst);

                                return (
                                    <React.Fragment key={symbol || idx}>
                                        {/* Main Row */}
                                        <tr
                                            key={symbol || idx}
                                            className={`group transition-colors cursor-pointer ${isExpanded ? 'bg-purple-50/50 dark:bg-purple-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
                                            onClick={() => toggleExpand(symbol)}
                                        >
                                            <td className="py-4 pl-4">
                                                <div className="font-medium text-gray-900 dark:text-white max-w-md truncate" title={inst.name}>
                                                    {inst.name}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 font-mono flex items-center gap-2">
                                                    <span>{symbol}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {inst.amc || inst.fund_house || '-'}
                                            </td>
                                            <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold">
                                                        {schemeType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(symbol); }}
                                                    className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' : 'text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
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
                                                            className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 overflow-hidden"
                                                        >
                                                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">

                                                                {/* SECTION 1: Scheme Identity */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                                                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scheme Identity</h4>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400">Trading Symbol</p>
                                                                            <p className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">{symbol}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400">ISIN</p>
                                                                            {inst.isin ? (
                                                                                <p className="text-sm font-mono text-gray-700 dark:text-gray-200">{inst.isin}</p>
                                                                            ) : (
                                                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-100 dark:border-amber-800">
                                                                                    <AlertCircle size={10} />
                                                                                    ISIN: Not available (Zerodha)
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <div>
                                                                                <p className="text-[10px] text-gray-400">Plan</p>
                                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{plan}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] text-gray-400">Type</p>
                                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{schemeType}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* SECTION 2: Investment Rules */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Banknote className="h-4 w-4 text-green-500" />
                                                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Investment Rules</h4>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400">Min. Purchase Amount</p>
                                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                                {formatCurrency(inst.minimum_purchase_amount || inst.min_purchase_amount || inst.minimumPurchaseAmount)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex gap-2 mt-2">
                                                                            <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${(inst.purchase_allowed || inst.purchaseAllowed) ? 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                                                                                <span className="text-[10px] font-bold uppercase">{(inst.purchase_allowed || inst.purchaseAllowed) ? 'Buy' : 'No Buy'}</span>
                                                                            </div>
                                                                            <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${(inst.redemption_allowed || inst.redemptionAllowed) ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                                                                                <span className="text-[10px] font-bold uppercase">{(inst.redemption_allowed || inst.redemptionAllowed) ? 'Redeem' : 'Locked'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* SECTION 3: Pricing & Settlement */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <TrendingUp className="h-4 w-4 text-blue-500" />
                                                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pricing & Settlement</h4>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Latest NAV</p>
                                                                                <div className="group relative">
                                                                                    <Info size={10} className="text-gray-400 cursor-help" />
                                                                                    {/* Tooltip */}
                                                                                    <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 w-48 bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg z-20">
                                                                                        Provided by broker (may be delayed)
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-baseline gap-2">
                                                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                                                    {formatCurrency(inst.last_price || inst.lastPrice)}
                                                                                </p>
                                                                                <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                                                    {inst.last_price_date ? formatDate(inst.last_price_date) : (inst.lastPriceDate ? formatDate(inst.lastPriceDate) : 'Date N/A')}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-400 mt-0.5 italic flex items-center gap-1">
                                                                                <Info size={10} /> Provided by broker (may be delayed)
                                                                            </p>
                                                                        </div>

                                                                        <div className="grid grid-cols-2 gap-4 pt-1">
                                                                            <div>
                                                                                <p className="text-[10px] text-gray-400">Settlement Type</p>
                                                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{inst.settlement_type || inst.settlementType || '—'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] text-gray-400">Settlement Days</p>
                                                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{inst.settlement_value || inst.settlementValue || '—'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* SECTION 4: Actions (Mock Placeholders) */}
                                                                <div className="space-y-3 flex flex-col justify-end">
                                                                    <div className="space-y-2">
                                                                        {(inst.purchase_allowed || inst.purchaseAllowed) && (
                                                                            <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                                                                                Invest Now
                                                                            </button>
                                                                        )}

                                                                        {(inst.sip_allowed || inst.sipAllowed) && (
                                                                            <button className="w-full py-2 bg-white dark:bg-transparent border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                                                                                <Clock size={16} /> Start SIP
                                                                            </button>
                                                                        )}

                                                                        {!(inst.purchase_allowed || inst.purchaseAllowed) && !(inst.sip_allowed || inst.sipAllowed) && (
                                                                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                                                                <p className="text-xs text-gray-400">Trading currently paused for this scheme.</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                            </div>
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
                    <div className="text-center text-xs text-gray-400 mt-4 pb-4">
                        Showing {filteredInstruments.length} of {instruments.length} instruments
                    </div>
                </div>
            )}
        </div>
    );
}
