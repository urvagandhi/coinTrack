'use client';

import Search from 'lucide-react/dist/esm/icons/search';
import { useMemo, useState } from 'react';

export default function MfInstrumentList({ instruments, isLoading }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInstruments = useMemo(() => {
        if (!instruments) return [];
        if (!searchTerm) return instruments.slice(0, 50); // Limit initial view for performance

        const lowerTerm = searchTerm.toLowerCase();
        return instruments.filter(inst =>
            (inst.name && inst.name.toLowerCase().includes(lowerTerm)) ||
            (inst.amc && inst.amc.toLowerCase().includes(lowerTerm)) ||
            (inst.schemeType && inst.schemeType.toLowerCase().includes(lowerTerm))
        ).slice(0, 50); // Limit results
    }, [instruments, searchTerm]);

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
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="pb-4 pl-2">Scheme Name</th>
                                <th className="pb-4">AMC</th>
                                <th className="pb-4">Category</th>
                                <th className="pb-4 text-right pr-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-4">
                            {filteredInstruments.map((inst, idx) => (
                                <tr key={idx} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-4 pl-2">
                                        <div className="font-medium text-gray-900 dark:text-white max-w-md truncate" title={inst.name}>
                                            {inst.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                            {inst.tradingSymbol} | {inst.isin || 'NO ISIN'}
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {inst.amc || inst.fundHouse || '-'}
                                    </td>
                                    <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded-full uppercase">
                                            {inst.schemeType || inst.category || 'Equity'}
                                        </span>
                                        {inst.plan && <span className="ml-2 text-[10px] text-gray-400">{inst.plan}</span>}
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <button className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors">
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-center text-xs text-gray-400 mt-4">
                        Showing {filteredInstruments.length} of {instruments.length} instruments
                    </div>
                </div>
            )}
        </div>
    );
}
