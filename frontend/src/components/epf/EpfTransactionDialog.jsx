'use client';

import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, Calculator, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

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

function parseShortcutAmount(val) {
    if (!val) return '';
    let clean = val.toString().trim().replace(/,/g, '');
    
    if (/[lL]$/i.test(clean)) {
        let num = parseFloat(clean.substring(0, clean.length - 1));
        if (!isNaN(num)) return String(num * 100000);
    }
    if (/cr$/i.test(clean)) {
        let num = parseFloat(clean.substring(0, clean.length - 2));
        if (!isNaN(num)) return String(num * 10000000);
    }
    if (/[kK]$/i.test(clean)) {
        let num = parseFloat(clean.substring(0, clean.length - 1));
        if (!isNaN(num)) return String(num * 1000);
    }
    return val;
}

const INITIAL_STATE = {
    transactionDate: '',
    mode: 'AUTO_SALARY',
    isWithdrawal: false,
    basicDA: '',
    employeeContribution: '',
    employerEpfContribution: '',
    employerEpsContribution: '',
    vpfAmount: '',
    withdrawalAmount: '',
    remarks: '',
};

export default function EpfTransactionDialog({ isOpen, onClose, onSave, onDelete, initialData, settings }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const isW = !!initialData.withdrawalAmount && initialData.withdrawalAmount > 0;
                setFormData({
                    transactionDate: initialData.transactionDate || '',
                    mode: initialData.mode || 'AUTO_SALARY',
                    isWithdrawal: isW,
                    basicDA: initialData.basicDA ? String(initialData.basicDA) : (settings?.defaultBasicDA ? String(settings.defaultBasicDA) : ''),
                    employeeContribution: initialData.employeeContribution ? String(initialData.employeeContribution) : '',
                    employerEpfContribution: initialData.employerEpfContribution ? String(initialData.employerEpfContribution) : '',
                    employerEpsContribution: initialData.employerEpsContribution ? String(initialData.employerEpsContribution) : '',
                    vpfAmount: initialData.vpfAmount ? String(initialData.vpfAmount) : (settings?.monthlyVpfAmount ? String(settings.monthlyVpfAmount) : ''),
                    withdrawalAmount: initialData.withdrawalAmount ? String(initialData.withdrawalAmount) : '',
                    remarks: initialData.remarks || '',
                });
            } else {
                setFormData({
                    ...INITIAL_STATE,
                    transactionDate: new Date().toISOString().split('T')[0],
                    basicDA: settings?.defaultBasicDA ? String(settings.defaultBasicDA) : '',
                    vpfAmount: settings?.monthlyVpfAmount ? String(settings.monthlyVpfAmount) : '',
                });
            }
            setIsSubmitting(false);
        }
    }, [isOpen, initialData, settings]);

    if (!isOpen) return null;

    // Live preview of statutory calculation in AUTO_SALARY mode
    const basicNum = Number(formData.basicDA || 0);
    const vpfNum = Number(formData.vpfAmount || 0);
    const empRate = Number(settings?.employeeContributionRate || 12);
    const useActualEps = !!settings?.useActualSalaryForEps;

    let calcEmployee = 0;
    let calcEps = 0;
    let calcEmployerEpf = 0;

    if (basicNum > 0) {
        calcEmployee = Math.round((basicNum * (empRate / 100)) * 100) / 100;
        if (useActualEps) {
            calcEps = Math.round((basicNum * 0.0833) * 100) / 100;
        } else {
            const cappedBasic = Math.min(basicNum, 15000);
            calcEps = basicNum >= 15000 ? 1250.00 : Math.round((cappedBasic * 0.0833) * 100) / 100;
        }
        const totalEmployer = Math.round((basicNum * 0.12) * 100) / 100;
        calcEmployerEpf = Math.max(0, Math.round((totalEmployer - calcEps) * 100) / 100);
    }

    const calcTotalEpf = calcEmployee + calcEmployerEpf + vpfNum;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.transactionDate) {
            toast({ title: 'Validation Error', description: 'Transaction date is required.', variant: 'destructive' });
            return;
        }

        if (formData.isWithdrawal) {
            const wAmt = Number(formData.withdrawalAmount);
            if (!wAmt || wAmt <= 0) {
                toast({ title: 'Validation Error', description: 'Withdrawal amount must be greater than zero.', variant: 'destructive' });
                return;
            }
        } else if (formData.mode === 'AUTO_SALARY') {
            if (!basicNum || basicNum <= 0) {
                toast({ title: 'Validation Error', description: 'Basic+DA is required for AUTO_SALARY mode.', variant: 'destructive' });
                return;
            }
        } else if (formData.mode === 'MANUAL_OVERRIDE') {
            const empC = Number(formData.employeeContribution || 0);
            const empEpf = Number(formData.employerEpfContribution || 0);
            const empEps = Number(formData.employerEpsContribution || 0);
            const vpf = Number(formData.vpfAmount || 0);
            if (empC <= 0 && empEpf <= 0 && empEps <= 0 && vpf <= 0) {
                toast({ title: 'Validation Error', description: 'At least one contribution field must be provided in MANUAL_OVERRIDE mode.', variant: 'destructive' });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const payload = {
                transactionDate: formData.transactionDate,
                mode: formData.isWithdrawal ? 'MANUAL_OVERRIDE' : formData.mode,
                remarks: formData.remarks || undefined,
            };

            if (formData.isWithdrawal) {
                payload.withdrawalAmount = Number(formData.withdrawalAmount);
            } else if (formData.mode === 'AUTO_SALARY') {
                payload.basicDA = basicNum;
                if (formData.vpfAmount !== '') {
                    payload.vpfAmount = vpfNum;
                }
            } else {
                if (formData.employeeContribution !== '') payload.employeeContribution = Number(formData.employeeContribution);
                if (formData.employerEpfContribution !== '') payload.employerEpfContribution = Number(formData.employerEpfContribution);
                if (formData.employerEpsContribution !== '') payload.employerEpsContribution = Number(formData.employerEpsContribution);
                if (formData.vpfAmount !== '') payload.vpfAmount = Number(formData.vpfAmount);
            }

            await onSave(payload);
            onClose();
        } catch (err) {
            console.error('[EPF Dialog Error]', err);
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
                            {initialData ? 'Edit EPF Entry' : 'New EPF Transaction'}
                        </h2>
                        <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
                            {initialData ? `Txn #${initialData.transactionNo}` : 'Employee Provident Fund Ledger'}
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
                    <form id="epf-txn-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Entry Type Selector */}
                        <div className="flex items-center justify-between p-3 rounded-sm border border-border bg-muted/20">
                            <span className="text-[12px] font-medium text-foreground">Entry Category</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isWithdrawal: false })}
                                    className={`h-7 px-3 text-[11px] font-mono border rounded-xs transition-colors ${
                                        !formData.isWithdrawal
                                            ? 'bg-foreground text-background border-foreground font-semibold'
                                            : 'border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Contribution
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isWithdrawal: true })}
                                    className={`h-7 px-3 text-[11px] font-mono border rounded-xs transition-colors ${
                                        formData.isWithdrawal
                                            ? 'bg-[hsl(var(--loss))] text-white border-[hsl(var(--loss))] font-semibold'
                                            : 'border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Withdrawal
                                </button>
                            </div>
                        </div>

                        {/* Date & Mode */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                01. Date & Entry Mode
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
                                {!formData.isWithdrawal && (
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Calculation Mode *</label>
                                        <select
                                            value={formData.mode}
                                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                            className="ed-input w-full font-mono"
                                        >
                                            <option value="AUTO_SALARY">Auto Salary Split (Statutory Engine)</option>
                                            <option value="MANUAL_OVERRIDE">Manual Entry (Direct Fields)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Withdrawal Fields */}
                        {formData.isWithdrawal ? (
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-mono uppercase text-[hsl(var(--loss))] tracking-[0.1em] border-b border-border/50 pb-1">
                                    02. EPF Balance Withdrawal
                                </h3>
                                <div className="space-y-1.5">
                                    <label className="eyebrow text-[hsl(var(--loss))]">Withdrawal Amount (₹) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.withdrawalAmount}
                                        onChange={(e) => {
                                            const val = parseShortcutAmount(e.target.value);
                                            setFormData({ ...formData, withdrawalAmount: val });
                                        }}
                                        className="ed-input w-full font-mono text-lg font-semibold bg-[hsl(var(--loss))]/5 border-[hsl(var(--loss))]/30 focus:border-[hsl(var(--loss))]"
                                        placeholder="e.g. 50000"
                                    />
                                    {formData.withdrawalAmount && !isNaN(formData.withdrawalAmount) && (
                                        <p className="text-[11px] font-mono text-[hsl(var(--loss))]">
                                            {formatIndianCurrency(formData.withdrawalAmount)} (Deducted from EPF pool)
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : formData.mode === 'AUTO_SALARY' ? (
                            /* AUTO SALARY MODE */
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1 flex items-center justify-between">
                                    <span>02. Salary & Voluntary PF</span>
                                    <span className="text-[10px] text-[hsl(var(--accent))] flex items-center gap-1">
                                        <Calculator className="h-3 w-3" /> Statutory Split Engine Active
                                    </span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Monthly Basic + DA (₹) *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.basicDA}
                                            onChange={(e) => {
                                                const val = parseShortcutAmount(e.target.value);
                                                setFormData({ ...formData, basicDA: val });
                                            }}
                                            className="ed-input w-full font-mono font-semibold"
                                            placeholder="e.g. 50000"
                                        />
                                        {formData.basicDA && !isNaN(formData.basicDA) && (
                                            <p className="text-[10px] font-mono text-muted-foreground">
                                                {formatIndianCurrency(formData.basicDA)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Voluntary PF / VPF (₹) [Optional]</label>
                                        <input
                                            type="text"
                                            value={formData.vpfAmount}
                                            onChange={(e) => {
                                                const val = parseShortcutAmount(e.target.value);
                                                setFormData({ ...formData, vpfAmount: val });
                                            }}
                                            className="ed-input w-full font-mono"
                                            placeholder="e.g. 5000"
                                        />
                                        {formData.vpfAmount && !isNaN(formData.vpfAmount) && (
                                            <p className="text-[10px] font-mono text-muted-foreground">
                                                {formatIndianCurrency(formData.vpfAmount)} (100% to EPF)
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Live Breakdown Preview Card */}
                                {basicNum > 0 && (
                                    <div className="p-4 rounded-sm border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 space-y-2">
                                        <p className="text-[11px] font-mono font-semibold text-foreground flex items-center gap-1.5">
                                            <Info className="h-3.5 w-3.5 text-[hsl(var(--accent))]" /> Computed Statutory Split
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1 border-t border-[hsl(var(--accent))]/20">
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase">Employee ({empRate}%)</span>
                                                <span className="font-semibold text-foreground">{formatIndianCurrency(calcEmployee)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase">Employer EPF</span>
                                                <span className="font-semibold text-[hsl(var(--gain))]">{formatIndianCurrency(calcEmployerEpf)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase">Employer EPS</span>
                                                <span className="font-semibold text-[hsl(var(--accent))]">{formatIndianCurrency(calcEps)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase">Total EPF Deposit</span>
                                                <span className="font-bold text-[hsl(var(--gain))]">{formatIndianCurrency(calcTotalEpf)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* MANUAL OVERRIDE MODE */
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                    02. Explicit Manual Contributions (At least 1 required)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Employee Share (₹) [Optional]</label>
                                        <input
                                            type="text"
                                            value={formData.employeeContribution}
                                            onChange={(e) => setFormData({ ...formData, employeeContribution: parseShortcutAmount(e.target.value) })}
                                            className="ed-input w-full font-mono"
                                            placeholder="e.g. 6000"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Employer EPF Share (₹) [Optional]</label>
                                        <input
                                            type="text"
                                            value={formData.employerEpfContribution}
                                            onChange={(e) => setFormData({ ...formData, employerEpfContribution: parseShortcutAmount(e.target.value) })}
                                            className="ed-input w-full font-mono"
                                            placeholder="e.g. 4750"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Employer EPS Share (₹) [Optional]</label>
                                        <input
                                            type="text"
                                            value={formData.employerEpsContribution}
                                            onChange={(e) => setFormData({ ...formData, employerEpsContribution: parseShortcutAmount(e.target.value) })}
                                            className="ed-input w-full font-mono"
                                            placeholder="e.g. 1250"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Voluntary PF / VPF (₹) [Optional]</label>
                                        <input
                                            type="text"
                                            value={formData.vpfAmount}
                                            onChange={(e) => setFormData({ ...formData, vpfAmount: parseShortcutAmount(e.target.value) })}
                                            className="ed-input w-full font-mono"
                                            placeholder="e.g. 5000"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 3: Remarks */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                03. Remarks / Description
                            </h3>
                            <div className="space-y-1.5">
                                <label className="eyebrow">Remarks [Optional]</label>
                                <input
                                    type="text"
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    className="ed-input w-full"
                                    placeholder="e.g. April 2025 salary slip contribution"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto">
                    {initialData && initialData.id && onDelete ? (
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
                            form="epf-txn-form"
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-accent min-w-[100px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Entry'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
