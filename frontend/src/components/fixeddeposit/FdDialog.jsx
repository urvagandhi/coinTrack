'use client';

import { useToast } from '@/components/ui/use-toast';
import { Calculator, Loader2, X, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const INITIAL_STATE = {
    place: '',
    holderName: '',
    accountNumber: '',
    interestRate: '',
    issueDate: '',
    maturityDate: '',
    investmentPeriod: '',
    issueAmount: '',
    maturityAmount: '',
    nominee: '',
    remarks: '',
};

/**
 * Format currency in Indian standard (en-IN)
 */
function formatIndianCurrency(amount) {
    if (amount === null || amount === undefined || amount === '' || isNaN(amount)) return '';
    const num = Number(amount);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

/**
 * Helper to display amounts in Indian words (Lakh / Crore)
 */
function formatInIndianWords(amount) {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return '';
    if (num >= 10000000) {
        return `${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
        return `${(num / 100000).toFixed(2)} Lakh`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    return '';
}

/**
 * Helper to parse amount shortcuts (e.g. 5L -> 500000)
 */
function parseShortcutAmount(val) {
    if (!val) return '';
    let clean = val.toString().trim().replace(/,/g, '');
    
    // Lakhs
    if (/[lL]$/i.test(clean)) {
        let num = parseFloat(clean.substring(0, clean.length - 1));
        if (!isNaN(num)) return String(num * 100000);
    }
    // Crores
    if (/cr$/i.test(clean)) {
        let num = parseFloat(clean.substring(0, clean.length - 2));
        if (!isNaN(num)) return String(num * 10000000);
    }
    // Thousands
    if (/[kK]$/i.test(clean)) {
        let num = parseFloat(clean.substring(0, clean.length - 1));
        if (!isNaN(num)) return String(num * 1000);
    }
    return val;
}

/**
 * Calculate human-readable tenure (Years, Months, Days) from dates
 */
function calculateTenurePeriod(issueDate, maturityDate) {
    if (!issueDate || !maturityDate) return '';
    const start = new Date(issueDate);
    const end = new Date(maturityDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return '';

    let y1 = start.getFullYear(), m1 = start.getMonth(), d1 = start.getDate();
    let y2 = end.getFullYear(), m2 = end.getMonth(), d2 = end.getDate();

    let years = y2 - y1;
    let months = m2 - m1;
    let days = d2 - d1;

    if (days < 0) {
        months -= 1;
        const prevMonthDate = new Date(y2, m2, 0);
        days += prevMonthDate.getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);

    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return `${parts.join(', ')} (${totalDays} Days)`;
}

/**
 * Calculate FD Maturity Amount using Indian bank standard (quarterly compounding for full quarters + simple interest for remaining broken days)
 */
function calculateFdMaturity(issueAmount, interestRate, issueDate, maturityDate) {
    const P = parseFloat(issueAmount);
    const r = parseFloat(interestRate);
    if (!P || !r || P <= 0 || r <= 0) return null;

    if (!issueDate || !maturityDate) {
        const amount = P * Math.pow(1 + r / 400, 4);
        return Math.round(amount * 100) / 100;
    }

    const start = new Date(issueDate);
    const end = new Date(maturityDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

    // Calculate full months and remaining broken days
    let y1 = start.getFullYear(), m1 = start.getMonth(), d1 = start.getDate();
    let y2 = end.getFullYear(), m2 = end.getMonth(), d2 = end.getDate();

    let totalMonths = (y2 - y1) * 12 + (m2 - m1);
    let tempDate = new Date(start);
    tempDate.setMonth(tempDate.getMonth() + totalMonths);

    if (tempDate > end) {
        totalMonths -= 1;
        tempDate = new Date(start);
        tempDate.setMonth(tempDate.getMonth() + totalMonths);
    }

    const remainingDays = Math.round((end - tempDate) / (1000 * 60 * 60 * 24));
    const fullQuarters = Math.floor(totalMonths / 3);
    const extraMonths = totalMonths % 3;

    // 1. Compound for full quarters
    let currentAmount = P * Math.pow(1 + r / 400, fullQuarters);

    // 2. Simple interest for remaining extra months + extra days
    const totalExtraDays = (extraMonths * 30) + remainingDays;
    if (totalExtraDays > 0) {
        const simpleInterest = currentAmount * (r / 100) * (totalExtraDays / 365);
        currentAmount += simpleInterest;
    }

    return Math.round(currentAmount * 100) / 100;
}

/**
 * Calculate Interest Rate (% p.a.) from Maturity Amount and Initial Amount (Indian bank standard)
 */
function calculateFdInterestRate(issueAmount, maturityAmount, issueDate, maturityDate) {
    const P = parseFloat(issueAmount);
    const A = parseFloat(maturityAmount);
    if (!P || !A || P <= 0 || A <= P) return null;

    if (!issueDate || !maturityDate) {
        const rate = 400 * (Math.pow(A / P, 1 / 4) - 1);
        return Math.round(rate * 100) / 100;
    }

    const start = new Date(issueDate);
    const end = new Date(maturityDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

    let y1 = start.getFullYear(), m1 = start.getMonth(), d1 = start.getDate();
    let y2 = end.getFullYear(), m2 = end.getMonth(), d2 = end.getDate();

    let totalMonths = (y2 - y1) * 12 + (m2 - m1);
    let tempDate = new Date(start);
    tempDate.setMonth(tempDate.getMonth() + totalMonths);

    if (tempDate > end) {
        totalMonths -= 1;
        tempDate = new Date(start);
        tempDate.setMonth(tempDate.getMonth() + totalMonths);
    }

    const remainingDays = Math.round((end - tempDate) / (1000 * 60 * 60 * 24));
    const fullQuarters = Math.floor(totalMonths / 3);
    const extraMonths = totalMonths % 3;
    const totalExtraDays = (extraMonths * 30) + remainingDays;

    let low = 0.1, high = 100, bestRate = 0;
    for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        let testAmount = P * Math.pow(1 + mid / 400, fullQuarters);
        if (totalExtraDays > 0) {
            testAmount += testAmount * (mid / 100) * (totalExtraDays / 365);
        }
        if (testAmount >= A) {
            bestRate = mid;
            high = mid;
        } else {
            low = mid;
        }
    }

    return Math.round(bestRate * 100) / 100;
}

export default function FdDialog({ isOpen, onClose, onSave, onDelete, initialData }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const issueDate = initialData.issueDate || '';
                const maturityDate = initialData.maturityDate || '';
                const period = initialData.investmentPeriod || calculateTenurePeriod(issueDate, maturityDate);

                setFormData({
                    place: initialData.place || '',
                    holderName: initialData.holderName || '',
                    accountNumber: initialData.accountNumber || '',
                    interestRate: initialData.interestRate !== undefined && initialData.interestRate !== null ? String(initialData.interestRate) : '',
                    issueDate,
                    maturityDate,
                    investmentPeriod: period,
                    issueAmount: initialData.issueAmount !== undefined && initialData.issueAmount !== null ? String(initialData.issueAmount) : '',
                    maturityAmount: initialData.maturityAmount !== undefined && initialData.maturityAmount !== null ? String(initialData.maturityAmount) : '',
                    nominee: initialData.nominee || '',
                    remarks: initialData.remarks || '',
                });
            } else {
                setFormData({
                    ...INITIAL_STATE,
                    holderName: user?.name || user?.username || ''
                });
            }
            setIsSubmitting(false);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const triggerMaturityCalculation = (currData = formData) => {
        const mat = calculateFdMaturity(currData.issueAmount, currData.interestRate, currData.issueDate, currData.maturityDate);
        if (mat !== null) {
            setFormData(prev => ({ ...prev, maturityAmount: String(mat) }));
            toast({ title: 'Maturity Calculated', description: `Calculated Maturity Amount: ${formatIndianCurrency(mat)}` });
        } else {
            toast({ title: 'Calculation Notice', description: 'Please enter valid Issue Amount, Interest Rate, and Dates.', variant: 'warning' });
        }
    };

    const triggerRateCalculation = (currData = formData) => {
        const rate = calculateFdInterestRate(currData.issueAmount, currData.maturityAmount, currData.issueDate, currData.maturityDate);
        if (rate !== null) {
            setFormData(prev => ({ ...prev, interestRate: String(rate) }));
            toast({ title: 'Rate Calculated', description: `Calculated Interest Rate: ${rate}% p.a.` });
        } else {
            toast({ title: 'Calculation Notice', description: 'Please enter valid Issue Amount, Maturity Amount (> Issue Amount), and Dates.', variant: 'warning' });
        }
    };

    const handleIssueAmountChange = (e) => {
        const val = e.target.value;
        const parsedVal = parseShortcutAmount(val);
        setFormData(prev => {
            const next = { ...prev, issueAmount: parsedVal };
            if (next.interestRate && next.issueDate && next.maturityDate) {
                const mat = calculateFdMaturity(parsedVal, next.interestRate, next.issueDate, next.maturityDate);
                if (mat !== null) next.maturityAmount = String(mat);
            }
            return next;
        });
    };

    const handleInterestRateChange = (e) => {
        const val = e.target.value;
        setFormData(prev => {
            const next = { ...prev, interestRate: val };
            if (next.issueAmount && next.issueDate && next.maturityDate) {
                const mat = calculateFdMaturity(next.issueAmount, val, next.issueDate, next.maturityDate);
                if (mat !== null) next.maturityAmount = String(mat);
            }
            return next;
        });
    };

    const handleMaturityAmountChange = (e) => {
        const val = e.target.value;
        const parsedVal = parseShortcutAmount(val);
        setFormData(prev => {
            const next = { ...prev, maturityAmount: parsedVal };
            if (next.issueAmount && next.issueDate && next.maturityDate && parseFloat(parsedVal) > parseFloat(next.issueAmount)) {
                const rate = calculateFdInterestRate(next.issueAmount, parsedVal, next.issueDate, next.maturityDate);
                if (rate !== null) next.interestRate = String(rate);
            }
            return next;
        });
    };

    const handleDateChange = (field, val) => {
        setFormData(prev => {
            const next = { ...prev, [field]: val };
            const tenure = calculateTenurePeriod(next.issueDate, next.maturityDate);
            next.investmentPeriod = tenure;

            if (next.issueAmount && next.interestRate && next.issueDate && next.maturityDate) {
                const mat = calculateFdMaturity(next.issueAmount, next.interestRate, next.issueDate, next.maturityDate);
                if (mat !== null) next.maturityAmount = String(mat);
            } else if (next.issueAmount && next.maturityAmount && next.issueDate && next.maturityDate) {
                const rate = calculateFdInterestRate(next.issueAmount, next.maturityAmount, next.issueDate, next.maturityDate);
                if (rate !== null) next.interestRate = String(rate);
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.place || !formData.holderName || !formData.interestRate || !formData.issueDate || !formData.maturityDate || !formData.issueAmount) {
            toast({ title: 'Validation Error', description: 'Please fill out all required fields.', variant: 'destructive' });
            return;
        }

        if (new Date(formData.maturityDate) <= new Date(formData.issueDate)) {
            toast({ title: 'Validation Error', description: 'Maturity date must be after issue date.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                ...formData,
                interestRate: Number(formData.interestRate),
                issueAmount: Number(formData.issueAmount),
                maturityAmount: formData.maturityAmount ? Number(formData.maturityAmount) : undefined,
                investmentPeriod: formData.investmentPeriod || calculateTenurePeriod(formData.issueDate, formData.maturityDate),
            });
            onClose();
        } catch (error) {
            console.error('Error saving FD:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="ed-card w-full max-w-2xl relative flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-200">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />

                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="font-serif text-[24px] text-foreground leading-none mb-1">
                            {initialData ? 'Edit Fixed Deposit' : 'New Fixed Deposit'}
                        </h2>
                        <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
                            {initialData ? `FD #${initialData.fdNo}` : 'Enter deposit details'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <form id="fd-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Institution & Holder Info */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                01. General Info
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="eyebrow">Bank/Institution *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.place}
                                        onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                        className="ed-input w-full"
                                        placeholder="e.g. State Bank of India"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="eyebrow">Holder Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.holderName}
                                        readOnly
                                        disabled
                                        onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                                        className="ed-input w-full bg-muted/40 cursor-not-allowed opacity-70"
                                        placeholder="Primary account holder"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="eyebrow">Account / FD No.</label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                        className="ed-input w-full font-mono"
                                        placeholder="Optional A/C No."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Dates & Auto Tenure Period */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1 flex items-center justify-between">
                                <span>02. Tenure & Dates</span>
                                {formData.investmentPeriod && (
                                    <span className="text-[hsl(var(--accent))] flex items-center gap-1 font-normal lowercase tracking-normal">
                                        <Calendar className="h-3 w-3" /> {formData.investmentPeriod}
                                    </span>
                                )}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Issue Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.issueDate}
                                        onChange={(e) => handleDateChange('issueDate', e.target.value)}
                                        className="ed-input w-full font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Maturity Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.maturityDate}
                                        onChange={(e) => handleDateChange('maturityDate', e.target.value)}
                                        className="ed-input w-full font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financials (Initial Amount & Interest Rate, with Maturity Amount at the END) */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                03. Investment & Interest Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between h-5">
                                        <label className="eyebrow">Initial / Issue Amount (₹) *</label>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.issueAmount}
                                        onChange={handleIssueAmountChange}
                                        className="ed-input w-full font-mono"
                                        placeholder="e.g. 5L or 500000"
                                    />
                                    {formData.issueAmount && !isNaN(formData.issueAmount) && Number(formData.issueAmount) > 0 && (
                                        <p className="text-[11px] font-mono text-[hsl(var(--accent))] mt-1">
                                            {formatIndianCurrency(formData.issueAmount)}
                                            {formatInIndianWords(formData.issueAmount) ? ` (${formatInIndianWords(formData.issueAmount)})` : ''}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between h-5">
                                        <label className="eyebrow">Interest Rate (%) *</label>
                                        <button
                                            type="button"
                                            onClick={() => triggerRateCalculation()}
                                            className="text-[10px] font-mono text-[hsl(var(--accent))] hover:underline flex items-center gap-1"
                                            title="Auto-calculate Interest Rate from Maturity & Initial Amount"
                                        >
                                            <RefreshCw className="h-2.5 w-2.5" /> Calc Rate
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.interestRate}
                                        onChange={handleInterestRateChange}
                                        className="ed-input w-full font-mono"
                                        placeholder="e.g. 7.1"
                                    />
                                </div>
                            </div>

                            {/* Maturity Amount placed at the LAST of Financial Section */}
                            <div className="space-y-1.5 pt-2 border-t border-dashed border-border/60 mt-3">
                                <div className="flex items-center justify-between">
                                    <label className="eyebrow flex items-center gap-1.5 text-foreground font-semibold">
                                        <Sparkles className="h-3 w-3 text-[hsl(var(--gain))]" />
                                        Maturity Amount (₹)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => triggerMaturityCalculation()}
                                        className="text-[10px] font-mono text-[hsl(var(--accent))] hover:underline flex items-center gap-1"
                                        title="Auto-calculate Maturity Amount"
                                    >
                                        <Calculator className="h-3 w-3" /> Auto-Calc
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={formData.maturityAmount}
                                    onChange={handleMaturityAmountChange}
                                    className="ed-input w-full font-mono text-[16px] font-semibold text-[hsl(var(--gain))] bg-[hsl(var(--gain))]/5 border-[hsl(var(--gain))]/30 focus:border-[hsl(var(--gain))]"
                                    placeholder="0.00 (Auto-calculated)"
                                />
                                {formData.maturityAmount && !isNaN(formData.maturityAmount) && Number(formData.maturityAmount) > 0 && (
                                    <div className="flex items-center justify-between text-[11px] font-mono text-[hsl(var(--gain))] mt-1">
                                        <span>{formatIndianCurrency(formData.maturityAmount)} {formatInIndianWords(formData.maturityAmount) ? `(${formatInIndianWords(formData.maturityAmount)})` : ''}</span>
                                        {formData.issueAmount && Number(formData.maturityAmount) > Number(formData.issueAmount) && (
                                            <span className="text-muted-foreground">
                                                Est. Interest: +{formatIndianCurrency(Number(formData.maturityAmount) - Number(formData.issueAmount))}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 4: Nominee & Remarks */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                04. Additional Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Nominee Name</label>
                                    <input
                                        type="text"
                                        value={formData.nominee}
                                        onChange={(e) => setFormData({ ...formData, nominee: e.target.value })}
                                        className="ed-input w-full"
                                        placeholder="Nominee name (Optional)"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Remarks / Notes</label>
                                    <input
                                        type="text"
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        className="ed-input w-full"
                                        placeholder="Additional notes or references (Optional)"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto">
                    {initialData && onDelete ? (
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={isSubmitting}
                            className="text-[11px] font-mono text-[hsl(var(--loss))] hover:underline disabled:opacity-50"
                        >
                            [ DELETE FD ]
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="ed-btn bg-card border-border hover:bg-muted text-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="fd-form"
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-accent min-w-[100px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Deposit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


