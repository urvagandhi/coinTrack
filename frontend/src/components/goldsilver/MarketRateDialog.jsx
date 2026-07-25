'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export default function MarketRateDialog({ isOpen, metalType = 'GOLD', onClose, onSave }) {
    const [rate, setRate] = useState('');
    const [includeMatured, setIncludeMatured] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRate('');
            setIncludeMatured(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numRate = parseFloat(rate);
        if (isNaN(numRate) || numRate <= 0) return;

        setIsSubmitting(true);
        try {
            await onSave({
                metalType,
                newRate: numRate,
                includeMatured,
            });
            onClose();
        } catch (err) {
            console.error('Failed to update manual market rate:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl text-foreground">
                        Update Manual Rate ({metalType})
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <p className="text-[12px] text-muted-foreground">
                        This will update the pinned market rate across all your investments of type{' '}
                        <strong className="text-foreground">{metalType}</strong> that are set to <code className="text-amber-500 font-mono">MANUAL</code> mode.
                    </p>

                    <div className="space-y-1.5">
                        <label className="eyebrow">New Rate (₹ per gram) *</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            min="0.01"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder="e.g. 7200.00"
                            className="ed-input w-full font-mono text-[14px]"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="includeMaturedCheck"
                            checked={includeMatured}
                            onChange={(e) => setIncludeMatured(e.target.checked)}
                            className="rounded-xs border-border bg-background"
                        />
                        <label htmlFor="includeMaturedCheck" className="text-[12px] font-mono text-muted-foreground cursor-pointer">
                            Include MATURED holdings in rate update
                        </label>
                    </div>

                    <DialogFooter className="pt-4 border-t border-border flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="ed-btn bg-card border-border hover:bg-muted text-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !rate}
                            className="ed-btn ed-btn-accent"
                        >
                            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Market Rate'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
