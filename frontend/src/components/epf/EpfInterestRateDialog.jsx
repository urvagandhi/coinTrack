'use client';

import { useToast } from '@/components/ui/use-toast';
import { Loader2, Percent, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EpfInterestRateDialog({ isOpen, onClose, rates }) {
    if (!isOpen) return null;

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
