'use client';

import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ppfAPI } from '@/lib/api';
import { useEffect, useState } from 'react';

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

const INITIAL_STATE = {
    transactionDate: '',
    particulars: '',
    particularType: 'DEPOSIT',
    type: 'CREDIT', // 'CREDIT' or 'DEBIT' UI helper
    amount: '',
    remarks: '',
};

const CREDIT_PARTICULAR_TYPES = [
    { value: 'DEPOSIT', label: 'Deposit (Contribution)', defaultText: 'UPI / Bank Transfer' },
    { value: 'INTEREST_CREDIT', label: 'Interest Credit', defaultText: 'Interest Credited' },
];

const DEBIT_PARTICULAR_TYPES = [
    { value: 'WITHDRAWAL', label: 'Withdrawal', defaultText: 'To Partial Withdrawal' },
    { value: 'LOAN', label: 'Loan against PPF', defaultText: 'To Loan Advance' },
    { value: 'OTHER', label: 'Other Debit', defaultText: 'Debit Entry' },
];

export default function PpfDialog({ isOpen, onClose, onSave, onDelete, initialData }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const { data: withdrawalStatus } = useQuery({
        queryKey: ['withdrawalStatus'],
        queryFn: ppfAPI.getWithdrawalStatus,
        enabled: isOpen,
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    transactionDate: initialData.transactionDate || '',
                    particulars: initialData.particulars || '',
                    particularType: initialData.particularType || 'DEPOSIT',
                    type: initialData.debitAmount ? 'DEBIT' : 'CREDIT',
                    amount: initialData.debitAmount || initialData.creditAmount || '',
                    remarks: initialData.remarks || '',
                });
            } else {
                setFormData(INITIAL_STATE);
            }
            setIsSubmitting(false);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const availableParticularTypes = formData.type === 'CREDIT' 
        ? CREDIT_PARTICULAR_TYPES 
        : DEBIT_PARTICULAR_TYPES;

    const handleTypeChange = (newType) => {
        setFormData(prev => {
            const validTypes = newType === 'CREDIT' ? CREDIT_PARTICULAR_TYPES : DEBIT_PARTICULAR_TYPES;
            const isCurrentValid = validTypes.some(pt => pt.value === prev.particularType);
            const nextParticularType = isCurrentValid ? prev.particularType : validTypes[0].value;
            const defaultText = validTypes.find(pt => pt.value === nextParticularType)?.defaultText || '';

            return {
                ...prev,
                type: newType,
                particularType: nextParticularType,
                particulars: (!prev.particulars || prev.particulars === 'Deposit' || prev.particulars === 'Withdrawal') ? defaultText : prev.particulars
            };
        });
    };

    const handleParticularTypeChange = (newParticularType) => {
        setFormData(prev => {
            const validTypes = prev.type === 'CREDIT' ? CREDIT_PARTICULAR_TYPES : DEBIT_PARTICULAR_TYPES;
            const matched = validTypes.find(pt => pt.value === newParticularType);
            return {
                ...prev,
                particularType: newParticularType,
                particulars: (!prev.particulars || CREDIT_PARTICULAR_TYPES.concat(DEBIT_PARTICULAR_TYPES).some(pt => pt.defaultText === prev.particulars))
                    ? (matched?.defaultText || prev.particulars)
                    : prev.particulars
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.transactionDate || !formData.particulars || !formData.amount) {
            toast({ title: 'Validation Error', description: 'Please fill out all required fields.', variant: 'destructive' });
            return;
        }

        const amt = Number(formData.amount);
        if (amt <= 0) {
            toast({ title: 'Validation Error', description: 'Amount must be greater than zero.', variant: 'destructive' });
            return;
        }

        if (formData.type === 'DEBIT' && formData.particularType === 'WITHDRAWAL' && withdrawalStatus) {
            if (!withdrawalStatus.withdrawalAllowed) {
                toast({ title: 'Withdrawal Not Allowed', description: withdrawalStatus.errorMessage || 'You are not eligible for a withdrawal.', variant: 'destructive' });
                return;
            }
            if (withdrawalStatus.maxWithdrawalAmount && amt > withdrawalStatus.maxWithdrawalAmount) {
                toast({ title: 'Limit Exceeded', description: `Maximum allowed withdrawal is ${formatIndianCurrency(withdrawalStatus.maxWithdrawalAmount)}`, variant: 'destructive' });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSave({
                transactionDate: formData.transactionDate,
                particulars: formData.particulars,
                particularType: formData.particularType,
                remarks: formData.remarks,
                creditAmount: formData.type === 'CREDIT' ? amt : undefined,
                debitAmount: formData.type === 'DEBIT' ? amt : undefined,
            });
            onClose();
        } catch (error) {
            console.error('Error saving PPF transaction:', error);
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
                            {initialData ? 'Edit Transaction' : 'New Transaction'}
                        </h2>
                        <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
                            {initialData ? `Txn #${initialData.transactionNo}` : 'PPF Ledger Entry'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="ppf-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Transaction & Type */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                01. Transaction & Type
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Transaction Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.transactionDate}
                                        onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                                        className="ed-input w-full font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Entry Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className="ed-input w-full"
                                    >
                                        <option value="CREDIT">Credit (Deposit/Interest)</option>
                                        <option value="DEBIT">Debit (Withdrawal/Loan)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Amount & Payment Details */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                02. Amount & Payment Info
                            </h3>
                            
                            <div className="space-y-1.5">
                                <label className="eyebrow">Amount (₹) *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const parsed = parseShortcutAmount(val);
                                        setFormData({ ...formData, amount: parsed });
                                    }}
                                    className="ed-input w-full font-mono text-lg font-semibold bg-[hsl(var(--accent))]/5 border-[hsl(var(--accent))]/30 focus:border-[hsl(var(--accent))]"
                                    placeholder="e.g. 1.5L or 150000"
                                />
                                {formData.amount && !isNaN(formData.amount) && Number(formData.amount) > 0 && (
                                    <p className="text-[11px] font-mono text-[hsl(var(--accent))] mt-1">
                                        {formatIndianCurrency(formData.amount)}
                                        {formatInIndianWords(formData.amount) ? ` (${formatInIndianWords(formData.amount)})` : ''}
                                    </p>
                                )}
                                {formData.type === 'DEBIT' && formData.particularType === 'WITHDRAWAL' && withdrawalStatus && (
                                    <div className="mt-2 p-2 bg-muted rounded-md text-xs border border-border">
                                        {!withdrawalStatus.withdrawalAllowed ? (
                                            <p className="text-[hsl(var(--loss))] font-medium">⚠️ {withdrawalStatus.errorMessage || 'Withdrawal not allowed.'}</p>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                Eligible for withdrawal. 
                                                {withdrawalStatus.maxWithdrawalAmount > 0 && (
                                                    <span className="block mt-1 font-mono text-[hsl(var(--accent))]">Max Limit: {formatIndianCurrency(withdrawalStatus.maxWithdrawalAmount)}</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Particular Type *</label>
                                    <select
                                        value={formData.particularType}
                                        onChange={(e) => handleParticularTypeChange(e.target.value)}
                                        className="ed-input w-full"
                                    >
                                        {availableParticularTypes.map(pt => (
                                            <option key={pt.value} value={pt.value}>{pt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Payment Mode / Particulars *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.particulars}
                                        onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                                        className="ed-input w-full"
                                        placeholder="e.g. UPI, Cash, NEFT, Cheque"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Additional Notes */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                03. Additional Notes
                            </h3>
                            <div className="space-y-1.5">
                                <label className="eyebrow">Description / Remarks</label>
                                <input
                                    type="text"
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    className="ed-input w-full"
                                    placeholder="e.g. Monthly contribution details"
                                />
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
                            [ DELETE ]
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
                            form="ppf-form"
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-accent min-w-[100px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
