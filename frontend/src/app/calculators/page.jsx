'use client';

import {
    BarChart2,
    Calculator,
    ChevronRight,
    FileText,
    Home,
    PiggyBank,
    Search,
    Target,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const calculatorCategories = [
    {
        id: 'investment',
        name: 'Investment',
        description: 'Grow your wealth with smart investment planning',
        icon: TrendingUp,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        calculators: [
            { id: 'sip', name: 'SIP Calculator', description: 'Calculate returns on your monthly investments' },
            { id: 'step-up-sip', name: 'Step-Up SIP', description: 'Plan for increasing investments over time' },
            { id: 'lumpsum', name: 'Lumpsum', description: 'One-time investment future value' },
            { id: 'cagr', name: 'CAGR', description: 'Calculate Compound Annual Growth Rate' },
            { id: 'xirr', name: 'XIRR', description: 'Extended Internal Rate of Return analysis' },
            { id: 'stock-average', name: 'Stock Average', description: 'Calculate average price of your stock holdings' },
            { id: 'inflation', name: 'Inflation', description: 'See how inflation affects your money' },
        ]
    },
    {
        id: 'savings',
        name: 'Savings Schemes',
        description: 'Government backed savings and pension schemes',
        icon: PiggyBank,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        calculators: [
            { id: 'ppf', name: 'PPF', description: 'Public Provident Fund corpus calculator' },
            { id: 'epf', name: 'EPF', description: 'Employee Provident Fund estimation' },
            { id: 'fd', name: 'Fixed Deposit', description: 'Returns on your fixed deposits' },
            { id: 'rd', name: 'Recurring Deposit', description: 'Monthly deposit maturity value' },
            { id: 'ssy', name: 'SSY', description: 'Sukanya Samriddhi Yojana for girl child' },
            { id: 'nps', name: 'NPS', description: 'National Pension System retirement corpus' },
            { id: 'nsc', name: 'NSC', description: 'National Savings Certificate returns' },
            { id: 'scss', name: 'SCSS', description: 'Senior Citizens Savings Scheme' },
            { id: 'mis', name: 'PO MIS', description: 'Post Office Monthly Income Scheme' },
            { id: 'apy', name: 'APY', description: 'Atal Pension Yojana pension calculator' },
        ]
    },
    {
        id: 'loans',
        name: 'Loans & EMI',
        description: 'Smart loan planning and EMI calculations',
        icon: Home,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        calculators: [
            { id: 'emi', name: 'EMI Calculator', description: 'Standard loan EMI calculator' },
            { id: 'home-loan-emi', name: 'Home Loan', description: 'Plan your dream home purchase' },
            { id: 'car-loan-emi', name: 'Car Loan', description: 'Calculate car loan payments' },
            { id: 'simple-interest', name: 'Simple Interest', description: 'Basic interest calculation' },
            { id: 'compound-interest', name: 'Compound Interest', description: 'Power of compounding' },
            { id: 'flat-vs-reducing', name: 'Flat vs Reducing', description: 'Compare interest rate methods' },
        ]
    },
    {
        id: 'tax',
        name: 'Tax & Salary',
        description: 'Income tax, deductions and salary planning',
        icon: FileText,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        calculators: [
            { id: 'income-tax', name: 'Income Tax', description: 'Compare Old vs New Tax Regime' },
            { id: 'hra', name: 'HRA Exemption', description: 'Calculate House Rent Allowance' },
            { id: 'salary', name: 'Salary Calculator', description: 'In-hand salary breakdown' },
            { id: 'gratuity', name: 'Gratuity', description: 'Estimate your gratuity details' },
            { id: 'gst', name: 'GST Calculator', description: 'Inclusive and Exclusive GST' },
            { id: 'tds', name: 'TDS Calculator', description: 'Tax Deducted at Source' },
        ]
    },
    {
        id: 'trading',
        name: 'Trading',
        description: 'Stock market and trading utilities',
        icon: BarChart2,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        calculators: [
            { id: 'brokerage', name: 'Brokerage', description: 'Calculate exact brokerage duties' },
            { id: 'margin', name: 'Margin', description: 'Required margin for trades' },
        ]
    },
    {
        id: 'planning',
        name: 'Financial Planning',
        description: 'Long-term goals and retirement planning',
        icon: Target,
        color: 'text-rose-500',
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        calculators: [
            { id: 'retirement', name: 'Retirement', description: 'Plan your golden years' },
        ]
    },
];

export default function CalculatorsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = calculatorCategories.map(cat => ({
        ...cat,
        calculators: cat.calculators.filter(calc =>
            calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            calc.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.calculators.length > 0);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto py-8">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 mb-4">
                    <Calculator className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    Financial Calculators
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                    Comprehensive tools to plan your investments, taxes, and financial goals with precision.
                </p>

            </div>

            {/* Search Bar - Sticky */}
            <div className="sticky top-[4rem] z-40 py-4 -mx-4 px-4 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 shadow-sm">
                <div className="relative max-w-md mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for a calculator..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm shadow-purple-500/5"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-16">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <div key={category.id} className="scroll-mt-24" id={category.id}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${category.bgColor}`}>
                                    <category.icon className={`w-6 h-6 ${category.color}`} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {category.name}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {category.description}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {category.calculators.map((calc) => (
                                    <Link
                                        key={calc.id}
                                        href={`/calculators/${category.id}/${calc.id}`}
                                        className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0`}>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>

                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {calc.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {calc.description}
                                        </p>

                                        <div className="mt-auto pt-4 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                            <span>Calculate Now</span>
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text- সাদা">No calculators found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Try adjusting your search query
                        </p>
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-8 mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                    All calculations are for informational purposes only. CoinTrack does not guarantee accuracy.
                    <br />
                    Consult a qualified financial advisor before making any investment decisions.
                </p>
            </div>
        </div>
    );
}
