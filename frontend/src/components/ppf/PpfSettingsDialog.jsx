'use client';

import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';

const INITIAL_STATE = {
    accountNumber: '',
    dateOfIssue: '',
    extensionMode: 'WITHOUT_CONTRIBUTION',
};

export default function PpfSettingsDialog({ isOpen, onClose, settings, onSaveSettings }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setFormData({
                accountNumber: settings?.accountNumber || '',
                dateOfIssue: settings?.dateOfIssue || '',
                extensionMode: settings?.extensionMode || 'WITHOUT_CONTRIBUTION',
            });
            setIsSubmitting(false);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSaveSettings({
                accountNumber: formData.accountNumber || null,
                dateOfIssue: formData.dateOfIssue || null,
                extensionMode: formData.extensionMode || 'WITHOUT_CONTRIBUTION',
            });
            toast({ title: 'PPF Account Updated', description: 'Account details saved.', variant: 'success' });
            onClose();
        } catch (err) {
            toast({ title: 'Save Failed', description: err?.message || 'Please try again.', variant: 'destructive' });
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

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[hsl(var(--accent))]" strokeWidth={1.5} />
                        <div>
                            <h2 className="font-serif text-[22px] text-foreground leading-none mb-0.5">
                                PPF Account Settings
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
                                Account details are shown across the ledger
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

                {/* Form */}
                <div className="p-6 overflow-y-auto">
                    <form id="ppf-settings-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="eyebrow">PPF Account Number</label>
                            <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                className="ed-input w-full font-mono tracking-wider text-[15px]"
                                placeholder="e.g. 38122258087"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Stored once and displayed in the ledger header. You can edit it at any time here.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="eyebrow">Date of Account Opening</label>
                            <input
                                type="date"
                                value={formData.dateOfIssue}
                                onChange={(e) => setFormData({ ...formData, dateOfIssue: e.target.value })}
                                className="ed-input w-full font-mono"
                            />
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="eyebrow">Post-Maturity Extension Mode</label>
                            <select
                                value={formData.extensionMode}
                                onChange={(e) => setFormData({ ...formData, extensionMode: e.target.value })}
                                className="ed-input w-full"
                            >
                                <option value="WITHOUT_CONTRIBUTION">Retain Without Contributions (Default)</option>
                                <option value="WITH_CONTRIBUTION">Extend With Contributions (Form H)</option>
                            </select>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                This determines withdrawal limits and contribution eligibility after 15 years.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer */}
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
                        form="ppf-settings-form"
                        disabled={isSubmitting}
                        className="ed-btn ed-btn-accent min-w-[100px]"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
