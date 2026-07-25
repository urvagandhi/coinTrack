'use client';

import { useToast } from '@/components/ui/use-toast';
import { Loader2, Percent, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EpfInterestRateDialog({ isOpen, onClose, rates, onSaveRate }) {
    const [financialYear, setFinancialYear] = useState('');
    const [ratePercent, setRatePercent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            // Default to current FY
            const now = new Date();
            const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            setFinancialYear(`${y}-${String(y + 1).slice(-2)}`);
            setRatePercent('8.25');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const r = Number(ratePercent);
        if (!financialYear || !ratePercent || isNaN(r) || r <= 0 || r > 30) {
            toast({ title: 'Validation Error', description: 'Please enter a valid financial year (e.g. 2025-26) and rate (e.g. 8.25).', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSaveRate({
                financialYear,
                ratePercent: r,
            });
            toast({ title: 'Interest Rate Saved', variant: 'success' });
            setRatePercent('');
        } catch (err) {
            console.error('[Rate Save Error]', err);
            toast({ title: 'Save Failed', description: err?.message || 'Could not save interest rate.', variant: 'destructive' });
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
                        <Percent className="h-5 w-5 text-[hsl(var(--accent))]" />
                        <div>
                            <h2 className="font-serif text-[22px] text-foreground leading-none">
                                EPFO FY Interest Rates
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
                                User-Maintained Reference Data
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

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Add / Update Rate Form */}
                    <form onSubmit={handleSubmit} className="p-4 rounded-sm border border-border bg-muted/20 space-y-4">
                        <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] font-semibold">
                            Configure / Update FY Rate
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="eyebrow">Financial Year *</label>
                                <input
                                    type="text"
                                    required
                                    value={financialYear}
                                    onChange={(e) => setFinancialYear(e.target.value)}
                                    className="ed-input w-full font-mono text-sm"
                                    placeholder="e.g. 2025-26"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="eyebrow">Declared Rate (%) *</label>
                                <input
                                    type="text"
                                    required
                                    value={ratePercent}
                                    onChange={(e) => setRatePercent(e.target.value)}
                                    className="ed-input w-full font-mono text-sm font-semibold"
                                    placeholder="e.g. 8.25"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-accent w-full flex items-center justify-center gap-1.5"
                        >
                            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Save FY Interest Rate</>}
                        </button>
                    </form>

                    {/* Existing Configured Rates Table */}
                    <div className="space-y-2">
                        <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em]">
                            Configured EPFO Rates
                        </h3>
                        {rates && rates.length > 0 ? (
                            <div className="border border-border rounded-sm overflow-hidden">
                                <table className="w-full text-left text-[12px] font-mono">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-muted-foreground text-[10px] uppercase">
                                            <th className="py-2 px-3">Financial Year</th>
                                            <th className="py-2 px-3 text-right">Annual Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rates.map((r) => (
                                            <tr key={r.id || r.financialYear} className="border-b border-hairline hover:bg-muted/20">
                                                <td className="py-2 px-3 font-semibold text-foreground">{r.financialYear}</td>
                                                <td className="py-2 px-3 text-right text-[hsl(var(--accent))] font-bold">{r.ratePercent}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-[12px] text-muted-foreground italic font-serif py-2">
                                No custom rates configured yet. Default reference rate will apply.
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 flex justify-end mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="ed-btn bg-card border-border hover:bg-muted text-foreground"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
