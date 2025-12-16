import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    Clock,
    History,
    PauseCircle,
    PlayCircle,
    TrendingDown,
    TrendingUp,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

const getEventIcon = (type) => {
    if (!type) return <CircleDollarSign className="h-4 w-4 text-gray-500" />;

    switch (type) {
        case 'BUY_EXECUTED': return <TrendingUp className="h-4 w-4 text-green-600" />;
        case 'SELL_EXECUTED':
        case 'REDEMPTION_COMPLETED': return <TrendingDown className="h-4 w-4 text-red-600" />;

        case 'SIP_CREATED': return <PlayCircle className="h-4 w-4 text-blue-600" />;
        case 'SIP_EXECUTION_SCHEDULED': return <Clock className="h-4 w-4 text-blue-400" />;

        case 'SIP_STATUS_ACTIVE': return <PlayCircle className="h-4 w-4 text-green-600" />;
        case 'SIP_STATUS_PAUSED': return <PauseCircle className="h-4 w-4 text-amber-600" />;
        case 'SIP_STATUS_CANCELLED': return <XCircle className="h-4 w-4 text-gray-500" />;

        case 'HOLDING_APPEARED': return <AlertCircle className="h-4 w-4 text-purple-600" />;
        case 'HOLDING_INCREASED': return <ArrowUpRight className="h-4 w-4 text-purple-600" />;
        case 'HOLDING_REDUCED': return <ArrowDownRight className="h-4 w-4 text-purple-600" />;

        default: return <CircleDollarSign className="h-4 w-4 text-gray-500" />;
    }
};

const getEventColor = (type) => {
    if (!type) return 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700';

    if (type.includes('BUY') || type === 'SIP_STATUS_ACTIVE') return 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800';
    if (type.includes('SELL') || type === 'REDEMPTION_COMPLETED') return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800';

    if (type === 'SIP_CREATED' || type === 'SIP_EXECUTION_SCHEDULED') return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800';
    if (type === 'SIP_STATUS_PAUSED') return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
    if (type === 'SIP_STATUS_CANCELLED') return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

    if (type.includes('HOLDING')) return 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800';

    return 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700';
};

const formatCurrency = (val) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 4
    }).format(val);
};

function MfTimelineEventCard({ event }) {
    return (
        <div className={`p-4 rounded-lg border ${getEventColor(event.eventType)} relative`}>
            <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                    {getEventIcon(event.eventType)}
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {event.eventType.replace(/_/g, ' ')}
                    </span>
                    {event.confidence === 'INFERRED' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-900/50">
                            Inferred
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown Date'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                {event.amount && (
                    <div>
                        <span className="text-gray-500 text-xs block">Amount</span>
                        <span className="font-medium">{formatCurrency(event.amount)}</span>
                    </div>
                )}
                {event.quantity && (
                    <div>
                        <span className="text-gray-500 text-xs block">Units</span>
                        <span className="font-medium">{event.quantity}</span>
                    </div>
                )}
                {event.nav && (
                    <div>
                        <span className="text-gray-500 text-xs block">NAV</span>
                        <span className="font-medium">₹{event.nav}</span>
                    </div>
                )}
                {event.source && (
                    <div>
                        <span className="text-gray-500 text-xs block">Source</span>
                        <span className="font-mono text-xs">{event.source}</span>
                    </div>
                )}
                {event.context && (
                    <div className="col-span-2">
                        <span className="text-gray-500 text-xs block">Note</span>
                        <span className="font-medium text-xs">{event.context}</span>
                    </div>
                )}
            </div>

            {/* Linking Info */}
            {(event.sipId || event.orderId) && (
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex gap-3">
                    {event.sipId && (
                        <div className="text-[10px] text-gray-400">
                            SIP Linked
                        </div>
                    )}
                    {event.orderId && (
                        <div className="text-[10px] text-gray-400 font-mono">
                            Ord: {event.orderId.substring(0, 8)}...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MfTimelineGroup({ fund, events, isExpanded, onToggle }) {
    // Sort events strictly by date DESC
    const sortedEvents = [...events].sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <button
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{fund}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{events.length} events recorded</p>
                    </div>
                </div>
                {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
            </button>

            {isExpanded && (
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6 pl-6 py-2">
                        {sortedEvents.map((event, idx) => (
                            <div key={event.eventId || idx} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                                </div>
                                <MfTimelineEventCard event={event} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MfTimeline({ events, isLoading }) {
    const [expandedFund, setExpandedFund] = useState(null);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Timeline Events</h3>
                <p className="text-gray-500 dark:text-gray-400">Your mutual fund journey hasn't started yet.</p>
            </div>
        );
    }

    // Group By Fund
    const groupedEvents = events.reduce((acc, event) => {
        const fundName = event.fund || 'Unknown Fund';
        if (!acc[fundName]) {
            acc[fundName] = [];
        }
        acc[fundName].push(event);
        return acc;
    }, {});

    const sortedFundNames = Object.keys(groupedEvents).sort();

    return (
        <div className="space-y-4">
            {sortedFundNames.map(fund => (
                <MfTimelineGroup
                    key={fund}
                    fund={fund}
                    events={groupedEvents[fund]}
                    isExpanded={expandedFund === fund}
                    onToggle={() => setExpandedFund(expandedFund === fund ? null : fund)}
                />
            ))}
        </div>
    );
}
