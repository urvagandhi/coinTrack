'use client';

import PageTransition from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';
import Banknote from 'lucide-react/dist/esm/icons/banknote';
import Bitcoin from 'lucide-react/dist/esm/icons/bitcoin';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Gem from 'lucide-react/dist/esm/icons/gem';
import Hash from 'lucide-react/dist/esm/icons/hash';
import Save from 'lucide-react/dist/esm/icons/save';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { useState } from 'react';

// Form Components
const FormSection = ({ title, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="space-y-4"
    >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-l-4 border-orange-500 pl-3">
            {title}
        </h3>
        {children}
    </motion.div>
);

const AssetTypeCard = ({ type, icon: Icon, selected, onClick, color }) => (
    <div
        onClick={onClick}
        className={`
            relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col items-center gap-3
            ${selected
                ? `bg-${color}-50 dark:bg-${color}-900/20 border-${color}-500 ring-1 ring-${color}-500`
                : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
        `}
    >
        <div className={`
            p-3 rounded-xl
            ${selected ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30` : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
        `}>
            <Icon className="w-6 h-6" />
        </div>
        <span className={`font-medium text-sm ${selected ? `text-${color}-700 dark:text-${color}-300` : 'text-gray-600 dark:text-gray-400'}`}>
            {type}
        </span>
        {selected && (
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${color}-500`} />
        )}
    </div>
);

export default function FormPage() {
    const [assetType, setAssetType] = useState('Stock');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                        </span>
                        New Investment
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-14">
                        Manually track an asset that isn't connected to a broker.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-xl space-y-10">

                    {/* 1. Asset Type Selection */}
                    <FormSection title="Select Asset Class" delay={0.1}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <AssetTypeCard
                                type="Stock"
                                icon={TrendingUp}
                                selected={assetType === 'Stock'}
                                onClick={() => setAssetType('Stock')}
                                color="blue"
                            />
                            <AssetTypeCard
                                type="Mutual Fund"
                                icon={Banknote}
                                selected={assetType === 'Mutual Fund'}
                                onClick={() => setAssetType('Mutual Fund')}
                                color="green"
                            />
                            <AssetTypeCard
                                type="Gold"
                                icon={Gem}
                                selected={assetType === 'Gold'}
                                onClick={() => setAssetType('Gold')}
                                color="yellow"
                            />
                            <AssetTypeCard
                                type="Crypto"
                                icon={Bitcoin}
                                selected={assetType === 'Crypto'}
                                onClick={() => setAssetType('Crypto')}
                                color="purple"
                            />
                        </div>
                    </FormSection>

                    {/* 2. Asset Details */}
                    <FormSection title="Asset Details" delay={0.2}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Symbol / Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. RELIANCE or NVDA"
                                    className="w-full p-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buying Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium text-gray-600 dark:text-gray-300"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* 3. Transaction Info */}
                    <FormSection title="Transaction Values" delay={0.3}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price per unit</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-mono font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                                <div className="relative">
                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-mono font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Invested</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        readOnly
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-500 font-mono font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Additional Notes */}
                    <FormSection title="Notes" delay={0.4}>
                        <textarea
                            rows="3"
                            placeholder="Add any strategic notes about why you made this investment..."
                            className="w-full p-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                        ></textarea>
                    </FormSection>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-4 pt-4"
                    >
                        <button
                            type="button"
                            className="flex-1 py-3.5 px-6 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-3.5 px-6 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Add Investment
                                </>
                            )}
                        </button>
                    </motion.div>

                </form>
            </div>
        </PageTransition>
    );
}
