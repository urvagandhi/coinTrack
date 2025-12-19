import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    CircleDollarSign,
    Clock,
    Filter,
    IndianRupee,
    Info,
    PauseCircle,
    PlayCircle,
    Search,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
    XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// --- Helper Functions ---

const getEventTheme = (type) => {
    if (!type) return { color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', icon: CircleDollarSign };

    // Buy / Active
    if (type.includes('BUY') || type === 'SIP_STATUS_ACTIVE') {
        return {
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            border: 'border-emerald-100 dark:border-emerald-800',
            icon: TrendingUp,
            gradient: 'from-emerald-500/20 to-emerald-500/5'
        };
    }

    // Sell / Redeem / Cancelled
    if (type.includes('SELL') || type === 'REDEMPTION_COMPLETED' || type === 'SIP_STATUS_CANCELLED') {
        return {
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-900/10',
            border: 'border-rose-100 dark:border-rose-800',
            icon: type === 'SIP_STATUS_CANCELLED' ? XCircle : TrendingDown,
            gradient: 'from-rose-500/20 to-rose-500/5'
        };
    }

    // SIP Created / Scheduled
    if (type === 'SIP_CREATED' || type === 'SIP_EXECUTION_SCHEDULED') {
        return {
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            border: 'border-blue-100 dark:border-blue-800',
            icon: type === 'SIP_EXECUTION_SCHEDULED' ? Clock : PlayCircle,
            gradient: 'from-blue-500/20 to-blue-500/5'
        };
    }

    // SIP Paused
    if (type === 'SIP_STATUS_PAUSED') {
        return {
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            border: 'border-amber-100 dark:border-amber-800',
            icon: PauseCircle,
            gradient: 'from-amber-500/20 to-amber-500/5'
        };
    }

    // Holding Updates
    if (type.includes('HOLDING')) {
        return {
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-50 dark:bg-violet-900/10',
            border: 'border-violet-100 dark:border-violet-800',
            icon: type === 'HOLDING_INCREASED' ? ArrowUpRight : (type === 'HOLDING_REDUCED' ? ArrowDownRight : AlertCircle),
            gradient: 'from-violet-500/20 to-violet-500/5'
        };
    }

    return { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', icon: CircleDollarSign, gradient: 'from-gray-500/20 to-gray-500/5' };
};

const formatCurrency = (val) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(val);
};

const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// --- Sub-Components ---

function MfTimelineEventCard({ event, isLast, highlight, variant = 'default' }) {
    const theme = getEventTheme(event.eventType);
    const Icon = theme.icon;

    return (
        <div className={`relative pl-6 md:pl-8 pb-6 md:pb-8 group/item ${highlight ? 'z-10' : ''}`}>
            {/* Connecting Line - Hidden on mobile for cleaner look */}
            {!isLast && (
                <div
                    className="hidden md:block absolute left-[11px] top-8 bottom-0 w-[2px] bg-gray-200 dark:bg-gray-700 group-hover/item:bg-gray-300 dark:group-hover/item:bg-gray-600 transition-colors"
                ></div>
            )}

            {/* Timeline Dot - Simplified on mobile */}
            <div className={`absolute left-0 top-1 h-5 w-5 md:h-6 md:w-6 rounded-full border-2 md:border-4 border-white dark:border-gray-900 flex items-center justify-center bg-white z-10 shadow-sm ${theme.color}`}>
                <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${theme.bg.replace('/10', '')} ring-1 md:ring-2 ring-current ring-opacity-20`}></div>
            </div>

            {/* Card Content */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative overflow-hidden rounded-xl border ${highlight ? 'border-purple-400 dark:border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900/50 shadow-md transform scale-[1.01]' : (variant === 'minimal' ? 'border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800' : theme.border + ' bg-white dark:bg-gray-800')} hover:shadow-md transition-all duration-300`}
            >
                {/* Subtle Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

                {highlight && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[9px] font-bold uppercase rounded-bl-lg">
                        Selected Event
                    </div>
                )}

                <div className={`relative ${variant === 'minimal' ? 'p-2.5 md:p-3' : 'p-3 md:p-4'}`}>
                    {/* Header: Type & Date */}
                    {variant !== 'minimal' && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${theme.bg}`}>
                                    <Icon className={`h-4 w-4 ${theme.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                        {event.eventType.replace(/_/g, ' ')}
                                    </h4>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md self-start sm:self-auto ml-9 sm:ml-0">
                                <Calendar className="h-3 w-3" />
                                {formatDate(event.eventDate)}
                            </span>
                        </div>
                    )}

                    {/* Minimal Header (Inline) */}
                    {variant === 'minimal' && (
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${theme.color} bg-white dark:bg-gray-800 border ${theme.border} px-1.5 py-0.5 rounded`}>
                                    {event.eventType.replace(/_/g, ' ')}
                                </span>
                                {event.orderId && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        #{event.orderId.slice(-6)}
                                    </span>
                                )}
                            </div>
                            {/* Optional Checkmark or Status Icon could go here */}
                        </div>
                    )}

                    {/* Data Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-3 md:gap-y-3 md:gap-x-4">
                        {event.amount && (
                            <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Amount</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                                    {formatCurrency(event.amount)}
                                </p>
                            </div>
                        )}
                        {event.nav && (
                            <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">NAV</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">₹{event.nav}</p>
                            </div>
                        )}
                        {event.quantity && (
                            <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Units</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{event.quantity}</p>
                            </div>
                        )}
                        {event.orderId && (
                            <div className="col-span-2 md:col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Order Ref</p>
                                <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 pt-0.5 truncate">{event.orderId}</p>
                            </div>
                        )}
                        {/* Context Badge */}
                        {event.sipId && (
                            <div className="col-span-2 flex justify-end">
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/50 font-medium">
                                    <PlayCircle className="h-3 w-3" /> SIP Linked
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer Info (Context/Note) */}
                    {(event.context) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex flex-wrap gap-2 text-xs text-gray-500">
                            {event.context && (
                                <span className="flex items-center gap-1.5 opacity-80">
                                    <Info className="h-3 w-3" />
                                    {event.context}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function MfTimelineClusterCard({ events, highlightId }) {
    const firstEvent = events[0];
    const theme = getEventTheme(firstEvent.eventType);
    const Icon = theme.icon;

    // Aggregate Data
    const totalAmount = events.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalQuantity = events.reduce((sum, e) => sum + (e.quantity || 0), 0);
    const isSell = firstEvent.eventType.includes('SELL') || firstEvent.eventType === 'REDEMPTION_COMPLETED';

    // Highlight check for cluster
    const hasHighlight = highlightId && events.some(e =>
        (e.orderId === highlightId) ||
        (e.sipId === highlightId && ['SIP_CREATED', 'SIP_STATUS_ACTIVE'].includes(e.eventType))
    );

    const [isExpanded, setIsExpanded] = useState(hasHighlight);


    return (
        <div className="relative pl-8 pb-8 group/cluster">
            {/* Note: Connecting line is handled by the parent loop logic or simplified here. */}
            <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-gray-200 dark:bg-gray-700 group-hover/cluster:bg-gray-300 dark:group-hover/cluster:bg-gray-600 transition-colors"></div>

            {/* Cluster Dot - Stacked Effect Ring */}
            <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center bg-white z-10 shadow-sm ${theme.color}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${theme.bg.replace('/10', '')} ring-2 ring-current ring-opacity-20`}></div>
                {/* Badge for count */}
                <div className="absolute -top-2 -right-2 h-4 w-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border border-white dark:border-gray-800">
                    {events.length}
                </div>
            </div>

            <motion.div
                layout
                className={`relative group-card transition-all duration-300`}
            >
                {/* Visual Stack Effect (Background Card) */}
                <div className={`absolute top-1.5 left-1.5 right-[-6px] bottom-[-6px] rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 -z-10 transition-all duration-300 ${isExpanded ? 'opacity-0 translate-y-0' : 'opacity-100'}`}></div>

                <div className={`relative overflow-hidden rounded-xl border ${hasHighlight ? 'border-purple-400 dark:border-purple-500 ring-2' : theme.border} bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300`}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full text-left p-4 flex flex-col gap-2 relative z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="flex justify-between items-start w-full">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${theme.bg}`}>
                                    <Icon className={`h-4 w-4 ${theme.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        {isSell ? 'Aggregated Sell Order' : `${firstEvent.eventType.replace(/_/g, ' ')} Group`}
                                        {hasHighlight && <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>}
                                    </h4>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {formatDate(firstEvent.eventDate)} • {events.length} Transactions
                                    </span>
                                </div>
                            </div>

                            <div className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 ml-2`}>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        {/* Summary Stats Pill */}
                        {(totalAmount > 0 || totalQuantity > 0) && (
                            <div className="mt-2 pl-[42px] flex flex-wrap gap-2">
                                {totalAmount > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200">
                                        Total: {formatCurrency(totalAmount)}
                                    </span>
                                )}
                                {totalQuantity > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Qty: {totalQuantity.toFixed(3)} units
                                    </span>
                                )}
                            </div>
                        )}
                    </button>

                    {/* Internal List */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="bg-gray-50/30 dark:bg-black/20 border-t border-gray-100 dark:border-gray-700/50"
                            >
                                <div className="p-3 space-y-4">
                                    {events.map((event, idx) => (
                                        <div key={event.eventId || idx} className="relative pl-6">
                                            {/* Sub-line */}
                                            <div className="absolute left-[8px] top-0 bottom-0 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                                            {/* Sub-dot */}
                                            <div className="absolute left-[5px] top-3 h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 ring-2 ring-gray-50 dark:ring-gray-900"></div>

                                            <MfTimelineEventCard
                                                event={event}
                                                isLast={true} // Don't draw main line inside card
                                                variant="minimal"
                                                highlight={highlightId && (
                                                    (event.orderId === highlightId) ||
                                                    (event.sipId === highlightId && ['SIP_CREATED', 'SIP_STATUS_ACTIVE'].includes(event.eventType))
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

function MfTimelineGroup({ fund, events, isExpanded, onToggle, highlightId }) {
    const sortedEvents = [...events].sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''));

    // Helper to group consecutive same-day, same-type events
    const groupedItems = useMemo(() => {
        if (!events.length) return [];
        const items = [];
        let currentGroup = [sortedEvents[0]];

        for (let i = 1; i < sortedEvents.length; i++) {
            const prev = currentGroup[0];
            const curr = sortedEvents[i];
            const prevDate = prev.eventDate ? prev.eventDate.split('T')[0] : 'nodate';
            const currDate = curr.eventDate ? curr.eventDate.split('T')[0] : 'nodate';

            // Rule: Collapse Repeated Events (Same Type + Same Day)
            // e.g. 4 SELLs on 2 Dec
            // We use strict eventType matching.
            if (curr.eventType === prev.eventType && currDate === prevDate) {
                currentGroup.push(curr);
            } else {
                items.push(currentGroup);
                currentGroup = [curr];
            }
        }
        items.push(currentGroup);
        return items;
    }, [sortedEvents]);

    // Determine group theme based on most recent event
    const lastEvent = sortedEvents[0];
    const groupTheme = lastEvent ? getEventTheme(lastEvent.eventType) : getEventTheme('');

    // Determine label: "Next" if future, "Last" if past
    const isFuture = lastEvent && (lastEvent.eventType === 'SIP_EXECUTION_SCHEDULED' || (lastEvent.eventDate && new Date(lastEvent.eventDate) > new Date()));
    const dateLabel = isFuture ? 'Next' : 'Last';

    return (
        <motion.div
            initial={false}
            className={`bg-white dark:bg-gray-800 rounded-2xl border ${isExpanded ? 'border-gray-300 dark:border-gray-600 ring-1 ring-gray-200 dark:ring-gray-700' : 'border-gray-100 dark:border-gray-700'} overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`}
        >
            <button
                className={`w-full px-4 py-3 md:px-5 md:py-4 flex items-center justify-between transition-colors ${isExpanded ? 'bg-gray-50/50 dark:bg-gray-700/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`p-2 md:p-2.5 rounded-xl ${groupTheme.bg} border ${groupTheme.border} shadow-sm flex-shrink-0`}>
                        <IndianRupee className={`h-4 w-4 md:h-5 md:w-5 ${groupTheme.color}`} />
                    </div>
                    <div className="text-left min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base leading-tight truncate">
                            {fund}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1">
                            <span className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                {events.length} Events
                            </span>
                            <span className="text-[10px] md:text-xs text-gray-400 hidden sm:inline">
                                {dateLabel}: {formatDate(lastEvent?.eventDate)}
                            </span>
                        </div>
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="px-3 pb-4 pt-2 md:px-5 md:pb-5 bg-gray-50/30 dark:bg-black/20 border-t border-gray-100 dark:border-gray-700/50">
                            {/* Scroll container if needed */}
                            <div className="mt-2 md:mt-4 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-1 md:pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">

                                {/* MOBILE VIEW: Show all events as individual cards (no clustering) */}
                                <div className="md:hidden space-y-3">
                                    {sortedEvents.map((event, idx) => {
                                        const isLastEvent = idx === sortedEvents.length - 1;
                                        const isHighlighted = highlightId && (
                                            (event.orderId === highlightId) ||
                                            (event.sipId === highlightId && ['SIP_CREATED', 'SIP_STATUS_ACTIVE'].includes(event.eventType))
                                        );
                                        return (
                                            <MfTimelineEventCard
                                                key={event.eventId || `m-${idx}`}
                                                event={event}
                                                isLast={isLastEvent}
                                                highlight={isHighlighted}
                                            />
                                        );
                                    })}
                                </div>

                                {/* DESKTOP VIEW: Show grouped/clustered cards */}
                                <div className="hidden md:block">
                                    {groupedItems.map((group, idx) => {
                                        const isLastGroup = idx === groupedItems.length - 1;

                                        // Single Item -> Normal Card
                                        if (group.length === 1) {
                                            const event = group[0];
                                            const isHighlighted = highlightId && (
                                                (event.orderId === highlightId) ||
                                                (event.sipId === highlightId && ['SIP_CREATED', 'SIP_STATUS_ACTIVE'].includes(event.eventType))
                                            );
                                            return (
                                                <MfTimelineEventCard
                                                    key={event.eventId || `s-${idx}`}
                                                    event={event}
                                                    isLast={isLastGroup}
                                                    highlight={isHighlighted}
                                                />
                                            );
                                        }
                                        // Multiple Items -> Cluster Card
                                        else {
                                            return (
                                                <MfTimelineClusterCard
                                                    key={`c-${idx}-${group[0].eventDate}`}
                                                    events={group}
                                                    highlightId={highlightId}
                                                />
                                            );
                                        }
                                    })}
                                </div>

                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function MfTimeline({ events, isLoading, onNavigate, initialContext }) {

    // --- State: Scope Dimensions ---
    const [scopeSipId, setScopeSipId] = useState(null);
    const [scopeTradingSymbol, setScopeTradingSymbol] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    // --- EFFECT: Parse Initial Context via Routing ---
    useEffect(() => {
        if (initialContext) {
            if (initialContext.sipId) {
                setScopeSipId(initialContext.sipId);
                setScopeTradingSymbol(null); // Mutual Exclusive Scope
                setSearchTerm('');
            } else if (initialContext.tradingSymbol) {
                setScopeTradingSymbol(initialContext.tradingSymbol);
                setScopeSipId(null); // Mutual Exclusive Scope
                setSearchTerm('');
            }
        }
    }, [initialContext]);


    // --- CLEAR FILTERS ---
    const handleClearFilter = () => {
        setScopeSipId(null);
        setScopeTradingSymbol(null);
        setSearchTerm('');
        setExpandedGroups(new Set());
        if (onNavigate) onNavigate('timeline', null);
    };

    // --- FILTER & GROUP LOGIC (Canonical Rule) ---
    const { displayedGroups, activeFilterName, totalFilteredEvents } = useMemo(() => {
        if (!events || events.length === 0) return { displayedGroups: [], activeFilterName: null, totalFilteredEvents: 0 };

        let filteredEvents = events;
        let filterName = null;

        // 1. Scope: SIP ID (Priority 1)
        if (scopeSipId) {
            filteredEvents = events.filter(e => e.sipId === scopeSipId);
            // Derive Name for UI
            const referenceEvent = filteredEvents.find(e => e.sipId === scopeSipId);
            if (referenceEvent) {
                filterName = `SIP: ${referenceEvent.fund} (${scopeSipId})`;
            } else {
                filterName = `SIP ID: ${scopeSipId}`;
            }
        }
        // 2. Scope: Trading Symbol (Priority 2)
        else if (scopeTradingSymbol) {
            filteredEvents = events.filter(e => e.tradingSymbol === scopeTradingSymbol);
            const referenceEvent = filteredEvents.find(e => e.tradingSymbol === scopeTradingSymbol);
            if (referenceEvent) {
                filterName = `Fund: ${referenceEvent.fund}`;
            } else {
                filterName = `Symbol: ${scopeTradingSymbol}`;
            }
        }
        // 3. Optional: Search Filter (UI convenience overlay)
        if (searchTerm) {
            const lowerService = searchTerm.toLowerCase();
            filteredEvents = filteredEvents.filter(e =>
                (e.fund && e.fund.toLowerCase().includes(lowerService)) ||
                (e.tradingSymbol && e.tradingSymbol.toLowerCase().includes(lowerService))
            );
        }

        // Grouping Logic
        const grouped = filteredEvents.reduce((acc, event) => {
            const key = event.tradingSymbol || 'UNKNOWN';
            if (!acc[key]) {
                acc[key] = {
                    name: event.fund || key,
                    symbol: key,
                    events: []
                };
            }
            acc[key].events.push(event);
            return acc;
        }, {});

        const groups = Object.keys(grouped).sort((a, b) => grouped[a].name.localeCompare(grouped[b].name))
            .map(key => grouped[key]);

        return { displayedGroups: groups, activeFilterName: filterName, totalFilteredEvents: filteredEvents.length };

    }, [events, scopeSipId, scopeTradingSymbol, searchTerm]);

    // Auto-Expand if single group
    useEffect(() => {
        if (displayedGroups.length === 1) {
            setExpandedGroups(new Set([displayedGroups[0].symbol]));
        }
    }, [displayedGroups]);


    const toggleGroup = (symbol) => {
        const next = new Set(expandedGroups);
        if (next.has(symbol)) {
            next.delete(symbol);
        } else {
            next.add(symbol);
        }
        setExpandedGroups(next);
    };

    // Initial load animation container
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 font-medium">Loading timeline...</p>
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                <div className="h-16 w-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                    <Wallet className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Timeline Events</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    Events related to your Mutual Fund portfolio, such as SIPs, Orders, and Trades, will appear here.
                </p>
            </div>
        );
    }

    // Distinct fund list for dropdown (OPTIONAL UI, keep it simple for now as requested strict rules mostly focus on nav)
    // We will keep the search bar for consistency but prioritize the scope banners.

    return (
        <div className="space-y-4">

            {/* --- Filter Bar (Always visible to allow manual override/search) --- */}
            {!scopeSipId && !scopeTradingSymbol && (
                <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-2 mb-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search funds in timeline..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* --- Active Scope Banner (Strict) --- */}
            <AnimatePresence>
                {(scopeSipId || scopeTradingSymbol) && (
                    <motion.div
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/50 rounded-xl mb-4 shadow-sm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex items-start md:items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide block mb-0.5">
                                    Active Filter Scope
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-gray-900 dark:text-white font-bold">
                                        {activeFilterName || 'Loading...'}
                                    </span>
                                    {/* Secondary Context Badges */}
                                    {scopeSipId ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-full">
                                            SIP Linked
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded-full">
                                            Fund Focused
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleClearFilter}
                            className="mt-3 md:mt-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm"
                        >
                            <X size={14} /> Clear Scope
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="space-y-4"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* Confidence Legend (Only show when not filtered) */}
                {!scopeSipId && !scopeTradingSymbol && searchTerm === '' && (
                    <motion.div
                        className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl"
                        variants={{
                            hidden: { opacity: 0, y: -5 },
                            show: { opacity: 1, y: 0 }
                        }}
                    >
                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-0.5">
                                Note on Data Accuracy
                            </span>
                            <span className="text-amber-700 dark:text-amber-400">
                                Some events are inferred from holdings. These are not broker-confirmed.
                            </span>
                        </div>
                    </motion.div>
                )}

                {displayedGroups.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No broker-reported events for this fund in the selected period. <button onClick={handleClearFilter} className="text-purple-600 hover:underline">Clear all</button>
                    </div>
                ) : (
                    displayedGroups.map(group => (
                        <MfTimelineGroup
                            key={group.symbol}
                            fund={group.name}
                            events={group.events}
                            isExpanded={expandedGroups.has(group.symbol)}
                            onToggle={() => toggleGroup(group.symbol)}
                            highlightId={initialContext?.highlightOrderId || initialContext?.highlightSipId}
                        />
                    ))
                )}
            </motion.div>
        </div>
    );
}
