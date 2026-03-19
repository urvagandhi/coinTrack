// src/app/calculators/page.jsx — Calculator landing hub, neutral card design
'use client';

import { BarChart2, CreditCard, FileText, PiggyBank, Search, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const calculatorCategories = [
    {
        id: 'investment', name: 'Investment', icon: TrendingUp,
        calculators: [
            { id: 'sip', name: 'SIP Calculator', description: 'Calculate returns on your monthly investments' },
            { id: 'step-up-sip', name: 'Step-Up SIP', description: 'Plan for increasing investments over time' },
            { id: 'lumpsum', name: 'Lumpsum', description: 'One-time investment future value' },
            { id: 'cagr', name: 'CAGR', description: 'Calculate Compound Annual Growth Rate' },
            { id: 'xirr', name: 'XIRR', description: 'Extended Internal Rate of Return analysis' },
            { id: 'stock-average', name: 'Stock Average', description: 'Calculate average price of your stock holdings' },
            { id: 'inflation', name: 'Inflation', description: 'See how inflation affects your money' },
        ],
    },
    {
        id: 'savings', name: 'Savings Schemes', icon: PiggyBank,
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
        ],
    },
    {
        id: 'loans', name: 'Loans & EMI', icon: CreditCard,
        calculators: [
            { id: 'emi', name: 'EMI Calculator', description: 'Standard loan EMI calculator' },
            { id: 'home-loan-emi', name: 'Home Loan', description: 'Plan your dream home purchase' },
            { id: 'car-loan-emi', name: 'Car Loan', description: 'Calculate car loan payments' },
            { id: 'simple-interest', name: 'Simple Interest', description: 'Basic interest calculation' },
            { id: 'compound-interest', name: 'Compound Interest', description: 'Power of compounding' },
            { id: 'flat-vs-reducing', name: 'Flat vs Reducing', description: 'Compare interest rate methods' },
        ],
    },
    {
        id: 'tax', name: 'Tax & Salary', icon: FileText,
        calculators: [
            { id: 'income-tax', name: 'Income Tax', description: 'Compare Old vs New Tax Regime' },
            { id: 'hra', name: 'HRA Exemption', description: 'Calculate House Rent Allowance' },
            { id: 'salary', name: 'Salary Calculator', description: 'In-hand salary breakdown' },
            { id: 'gratuity', name: 'Gratuity', description: 'Estimate your gratuity details' },
            { id: 'gst', name: 'GST Calculator', description: 'Inclusive and Exclusive GST' },
            { id: 'tds', name: 'TDS Calculator', description: 'Tax Deducted at Source' },
        ],
    },
    {
        id: 'trading', name: 'Trading', icon: BarChart2,
        calculators: [
            { id: 'brokerage', name: 'Brokerage', description: 'Calculate exact brokerage duties' },
            { id: 'margin', name: 'Margin', description: 'Required margin for trades' },
        ],
    },
    {
        id: 'planning', name: 'Financial Planning', icon: Target,
        calculators: [
            { id: 'retirement', name: 'Retirement', description: 'Plan your golden years' },
        ],
    },
];

export default function CalculatorsPage() {
    const [search, setSearch] = useState('');

    const filtered = calculatorCategories
        .map((cat) => ({
            ...cat,
            calculators: cat.calculators.filter(
                (c) =>
                    c.name.toLowerCase().includes(search.toLowerCase()) ||
                    c.description.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((cat) => cat.calculators.length > 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-2xl font-semibold text-foreground mb-2">Financial Calculators</h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Free tools to plan your investments, savings, taxes, and loans.
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm mx-auto mb-10">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search calculators..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 h-10 w-full bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
            </div>

            {/* Categories */}
            {filtered.length > 0 ? (
                filtered.map((category) => (
                    <div key={category.id} className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                <category.icon size={14} className="text-blue-600" />
                            </div>
                            <h2 className="text-sm font-semibold text-foreground">{category.name}</h2>
                            <span className="text-xs text-muted-foreground">({category.calculators.length})</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                            {category.calculators.map((calc) => (
                                <Link
                                    key={calc.id}
                                    href={`/calculators/${category.id}/${calc.id}`}
                                    className="flex flex-col gap-1.5 p-3 bg-card border border-border rounded-xl hover:border-blue-500/40 hover:bg-accent transition-colors group"
                                >
                                    <span className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {calc.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                        {calc.description}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                        <Search size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No calculators found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query</p>
                </div>
            )}

            {/* Disclaimer */}
            <div className="border-t border-border pt-8 text-center text-xs text-gray-400">
                All calculations are for informational purposes only. Consult a qualified financial advisor before making investment decisions.
            </div>
        </div>
    );
}
