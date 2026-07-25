'use client';

import { useToast } from '@/components/ui/use-toast';
import { Loader2, Settings, X, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function EpfSettingsDialog({ isOpen, onClose, settings, onSaveSettings }) {
    const [defaultBasicDA, setDefaultBasicDA] = useState('');
    const [employeeContributionRate, setEmployeeContributionRate] = useState('12.00');
    const [useActualSalaryForEps, setUseActualSalaryForEps] = useState(false);
    const [monthlyVpfAmount, setMonthlyVpfAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && settings) {
            setDefaultBasicDA(settings.defaultBasicDA !== undefined ? String(settings.defaultBasicDA) : '0');
            setEmployeeContributionRate(settings.employeeContributionRate !== undefined ? String(settings.employeeContributionRate) : '12.00');
            setUseActualSalaryForEps(!!settings.useActualSalaryForEps);
            setMonthlyVpfAmount(settings.monthlyVpfAmount !== undefined ? String(settings.monthlyVpfAmount) : '0');
            setIsSubmitting(false);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const basic = Number(defaultBasicDA || 0);
        const rate = Number(employeeContributionRate || 12);
        const vpf = Number(monthlyVpfAmount || 0);

        if (basic < 0 || rate < 0 || vpf < 0) {
            toast({ title: 'Validation Error', description: 'Values cannot be negative.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSaveSettings({
                defaultBasicDA: basic,
                employeeContributionRate: rate,
                useActualSalaryForEps,
                monthlyVpfAmount: vpf,
            });
            toast({ title: 'Settings Saved', variant: 'success' });
            onClose();
        } catch (err) {
            console.error('[Settings Save Error]', err);
            toast({ title: 'Save Failed', description: err?.message || 'Could not save settings.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="ed-card w-full max-w-lg relative flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />

                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <Settings className="h-5 w-5 text-[hsl(var(--accent))]" />
                        <div>
                            <h2 className="font-serif text-[22px] text-foreground leading-none">
                                EPF Configuration Settings
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
                                User-scoped Statutory Split Preferences
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">
                    <form id="epf-settings-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Default Basic + DA */}
                        <div className="space-y-1.5">
                            <label className="eyebrow">Default Monthly Basic + DA (₹) [Optional]</label>
                            <input
                                type="text"
                                value={defaultBasicDA}
                                onChange={(e) => setDefaultBasicDA(parseShortcutAmount(e.target.value))}
                                className="ed-input w-full font-mono text-base font-medium"
                                placeholder="e.g. 50000"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Pre-populates the salary field when creating AUTO_SALARY monthly entries.
                            </p>
                        </div>

                        {/* Employee Contribution Rate */}
                        <div className="space-y-1.5">
                            <label className="eyebrow">Employee Contribution Rate (%) *</label>
                            <select
                                value={employeeContributionRate}
                                onChange={(e) => setEmployeeContributionRate(e.target.value)}
                                className="ed-input w-full font-mono"
                            >
                                <option value="12.00">12.00% (Standard statutory rate)</option>
                                <option value="10.00">10.00% (Eligible establishments rate)</option>
                                <option value="8.00">8.00% (Reduced rate)</option>
                            </select>
                            <p className="text-[11px] text-muted-foreground">
                                Statutory percentage deducted from Basic+DA into your EPF account.
                            </p>
                        </div>

                        {/* EPS Statutory Cap Override Toggle */}
                        <div className="p-4 rounded-sm border border-border bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-serif text-[15px] font-medium text-foreground">
                                    Higher Pension EPS Override (Actual Salary) [Optional]
                                </span>
                                <input
                                    type="checkbox"
                                    checked={useActualSalaryForEps}
                                    onChange={(e) => setUseActualSalaryForEps(e.target.checked)}
                                    className="h-4 w-4 accent-[hsl(var(--accent))] rounded-xs cursor-pointer"
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {useActualSalaryForEps
                                    ? 'Uncapped: EPS contribution calculated as 8.33% of actual Basic+DA without capping at ₹1,250/month (post Nov 2022 Supreme Court ruling option).'
                                    : 'Default: EPS contribution capped at 8.33% of ₹15,000 (max ₹1,250/month). Excess employer 12% share goes to EPF balance.'}
                            </p>
                        </div>

                        {/* Default Monthly VPF */}
                        <div className="space-y-1.5">
                            <label className="eyebrow">Default Monthly VPF Amount (₹) [Optional]</label>
                            <input
                                type="text"
                                value={monthlyVpfAmount}
                                onChange={(e) => setMonthlyVpfAmount(parseShortcutAmount(e.target.value))}
                                className="ed-input w-full font-mono"
                                placeholder="e.g. 5000"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Voluntary Provident Fund amount added on top of statutory 12%. Renders 100% into EPF pool.
                            </p>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3 mt-auto">
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
                        form="epf-settings-form"
                        disabled={isSubmitting}
                        className="ed-btn ed-btn-accent min-w-[120px]"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
