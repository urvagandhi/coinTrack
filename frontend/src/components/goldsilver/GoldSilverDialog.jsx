import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, Info, Coins, Calculator, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { goldSilverAPI } from '@/lib/api';

const INITIAL_STATE = {
    purchaseDate: '',
    purchasedFrom: '',
    metalType: 'GOLD',
    purchaseItem: '',
    purity: '22',
    purityOptionId: '',
    rateSource: 'LIVE',
    ratePerGram: '',
    netWeight: '',
    makingChargePercent: '',
    stoneOtherCharges: '',
    gstPercent: '3.00',
    currentMarketRate: '',
    maturityDate: '',
    remarks: '',
};

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

export default function GoldSilverDialog({ isOpen, onClose, onSave, onDelete, initialData }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [purityOptions, setPurityOptions] = useState([]);
    const { toast } = useToast();

    // Calculated derived values for preview
    const [preview, setPreview] = useState({ metalAmount: 0, makingChargeAmount: 0, totalAmount: 0, gstAmount: 0, netAmount: 0 });

    useEffect(() => {
        if (isOpen) {
            goldSilverAPI.getPurityOptions(formData.metalType)
                .then(opts => setPurityOptions(opts))
                .catch(err => console.error('Failed to load purity options', err));
        }
    }, [isOpen, formData.metalType]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    purchaseDate: initialData.purchaseDate || '',
                    purchasedFrom: initialData.purchasedFrom || '',
                    metalType: initialData.metalType || 'GOLD',
                    purchaseItem: initialData.purchaseItem || '',
                    purity: initialData.purity ? String(initialData.purity) : '22',
                    purityOptionId: initialData.purityOptionId || '',
                    rateSource: initialData.rateSource || 'LIVE',
                    ratePerGram: initialData.ratePerGram ? String(initialData.ratePerGram) : '',
                    netWeight: initialData.netWeight ? String(initialData.netWeight) : '',
                    makingChargePercent: initialData.makingChargePercent ? String(initialData.makingChargePercent) : '',
                    stoneOtherCharges: initialData.stoneOtherCharges ? String(initialData.stoneOtherCharges) : '',
                    gstPercent: initialData.gstPercent !== undefined ? String(initialData.gstPercent) : '3.00',
                    currentMarketRate: initialData.currentMarketRate ? String(initialData.currentMarketRate) : '',
                    maturityDate: initialData.maturityDate || '',
                    remarks: initialData.remarks || '',
                });
            } else {
                setFormData(INITIAL_STATE);
            }
            setIsSubmitting(false);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (isOpen) {
            const weight = parseFloat(formData.netWeight) || 0;
            const rate = parseFloat(formData.ratePerGram) || 0;
            const makingPc = parseFloat(formData.makingChargePercent) || 0;
            const other = parseFloat(formData.stoneOtherCharges) || 0;
            const gstPc = parseFloat(formData.gstPercent) || 0;

            const metalAmt = weight * rate;
            const makingAmt = (metalAmt * makingPc) / 100;
            const totalAmt = metalAmt + makingAmt + other;
            const gstAmt = (totalAmt * gstPc) / 100;
            const netAmt = totalAmt + gstAmt;

            setPreview({
                metalAmount: metalAmt,
                makingChargeAmount: makingAmt,
                totalAmount: totalAmt,
                gstAmount: gstAmt,
                netAmount: netAmt,
            });
        }
    }, [formData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.purchaseDate || !formData.purchasedFrom || !formData.purchaseItem || 
            !formData.ratePerGram || !formData.netWeight) {
            toast({ title: 'Validation Error', description: 'Please fill out all required fields.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                ...formData,
                purity: Number(formData.purity || 24),
                purityOptionId: formData.purityOptionId || undefined,
                rateSource: formData.rateSource || 'LIVE',
                ratePerGram: Number(formData.ratePerGram),
                netWeight: Number(formData.netWeight),
                makingChargePercent: formData.makingChargePercent ? Number(formData.makingChargePercent) : 0,
                stoneOtherCharges: formData.stoneOtherCharges ? Number(formData.stoneOtherCharges) : 0,
                gstPercent: formData.gstPercent ? Number(formData.gstPercent) : 3,
                currentMarketRate: formData.currentMarketRate ? Number(formData.currentMarketRate) : undefined,
                maturityDate: formData.maturityDate || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Error saving Gold/Silver:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="ed-card w-full max-w-4xl relative flex flex-col max-h-[95vh] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />

                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="font-serif text-[24px] text-foreground leading-none mb-1 flex items-center gap-2">
                            {initialData ? 'Edit Investment' : 'New Investment'}
                            <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full border", 
                                formData.metalType === 'GOLD' ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-slate-500/10 text-slate-400 border-slate-500/30")}>
                                {formData.metalType}
                            </span>
                        </h2>
                        <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
                            {initialData ? `Item #${initialData.itemNo}` : 'Enter purchase details'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex flex-col md:flex-row h-full">
                    {/* Form Side */}
                    <div className="flex-1 p-6 space-y-6 md:border-r border-border">
                        <form id="gs-form" onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Section 1: Basic Info */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                    01. Basic Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Metal Type *</label>
                                        <select
                                            value={formData.metalType}
                                            onChange={(e) => setFormData({ ...formData, metalType: e.target.value, purityOptionId: '' })}
                                            className="ed-input w-full"
                                            disabled={!!initialData}
                                        >
                                            <option value="GOLD">GOLD</option>
                                            <option value="SILVER">SILVER</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Purchase Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.purchaseDate}
                                            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            className="ed-input w-full font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Purchased From *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.purchasedFrom}
                                            onChange={(e) => setFormData({ ...formData, purchasedFrom: e.target.value })}
                                            className="ed-input w-full"
                                            placeholder="e.g. Malabar, Tanishq"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Item Description *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.purchaseItem}
                                            onChange={(e) => setFormData({ ...formData, purchaseItem: e.target.value })}
                                            className="ed-input w-full"
                                            placeholder="e.g. Gold Coin, Necklace"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Weight & Rates */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                    02. Weight, Purity & Pricing Mode
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Net Weight (g) *</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            required
                                            value={formData.netWeight}
                                            onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
                                            className="ed-input w-full font-mono text-[hsl(var(--accent))]"
                                            placeholder="e.g. 10.00"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Purity Grade *</label>
                                        <select
                                            value={formData.purityOptionId}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const opt = purityOptions.find(p => p.id === selectedId);
                                                setFormData({
                                                    ...formData,
                                                    purityOptionId: selectedId,
                                                    purity: opt ? String(opt.karatValue || opt.fineness || 24) : formData.purity,
                                                });
                                            }}
                                            className="ed-input w-full font-mono text-[13px]"
                                        >
                                            <option value="">Select Purity</option>
                                            {purityOptions.map((opt) => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.label || opt.displayName || opt.code || `Purity ${((opt.purityFactor || 1) * 100).toFixed(1)}%`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Pricing Mode *</label>
                                        <div className="flex items-center gap-2 p-1 border border-border rounded-sm bg-muted/20">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rateSource: 'LIVE' })}
                                                className={cn("flex-1 py-1 text-[11px] font-mono rounded-xs transition-colors text-center",
                                                    formData.rateSource === 'LIVE' ? "bg-[hsl(var(--accent))] text-white font-medium shadow-xs" : "text-muted-foreground hover:text-foreground")}
                                            >
                                                LIVE (Auto Market)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rateSource: 'MANUAL' })}
                                                className={cn("flex-1 py-1 text-[11px] font-mono rounded-xs transition-colors text-center",
                                                    formData.rateSource === 'MANUAL' ? "bg-foreground text-background font-medium shadow-xs" : "text-muted-foreground hover:text-foreground")}
                                            >
                                                MANUAL (Pinned)
                                            </button>
                                        </div>
                                    </div>

                                    {formData.rateSource === 'LIVE' && (
                                        <div className="sm:col-span-2 p-2.5 rounded-sm bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-600 dark:text-blue-400 flex items-center justify-between">
                                            <span>ⓘ Powered by <strong>GoldAPI.io</strong> spot rate + local duty/premium. Automatically recomputes value daily.</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Purchase Rate / g (₹) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.ratePerGram}
                                            onChange={(e) => setFormData({ ...formData, ratePerGram: e.target.value })}
                                            className="ed-input w-full font-mono"
                                            placeholder="e.g. 7000"
                                        />
                                    </div>

                                    {formData.rateSource === 'MANUAL' && (
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="eyebrow">Pinned Market Rate / g (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.currentMarketRate}
                                                onChange={(e) => setFormData({ ...formData, currentMarketRate: e.target.value })}
                                                className="ed-input w-full font-mono text-[hsl(var(--accent))]"
                                                placeholder="Custom rate per gram"
                                            />
                                        </div>
                                    )}

                                    {formData.rateSource === 'LIVE' && (
                                        <div className="sm:col-span-2 p-2.5 rounded-sm border border-emerald-500/30 bg-emerald-500/5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                                            <span>Current value will automatically recompute off live market rate scaled by purity factor.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Charges & Taxes */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                    03. Charges & Taxes
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Making Chg (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.makingChargePercent}
                                            onChange={(e) => setFormData({ ...formData, makingChargePercent: e.target.value })}
                                            className="ed-input w-full font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Other Chg (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.stoneOtherCharges}
                                            onChange={(e) => setFormData({ ...formData, stoneOtherCharges: e.target.value })}
                                            className="ed-input w-full font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">GST (%) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.gstPercent}
                                            onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                                            className="ed-input w-full font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Maturity (For schemes) */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                                    04. Scheme Maturity & Notes (Optional)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Maturity Date (SGB/Schemes)</label>
                                        <input
                                            type="date"
                                            value={formData.maturityDate}
                                            onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                                            className="ed-input w-full font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="eyebrow">Remarks</label>
                                        <input
                                            type="text"
                                            value={formData.remarks}
                                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                            className="ed-input w-full"
                                            placeholder="Additional notes"
                                        />
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Consistent Preview Sidebar Side */}
                    <div className="w-full md:w-[280px] bg-muted/10 p-6 flex flex-col border-l border-border/40">
                        <div className="flex items-center gap-2 mb-6">
                            <Calculator className="h-4 w-4 text-[hsl(var(--accent))]" />
                            <h3 className="text-[13px] font-semibold text-foreground tracking-tight">Calculation Preview</h3>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-muted-foreground">Metal Amount</span>
                                <span className="font-mono text-foreground">{formatIndianCurrency(preview.metalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-muted-foreground">Making Charges</span>
                                <span className="font-mono text-foreground">+{formatIndianCurrency(preview.makingChargeAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-muted-foreground">Other Charges</span>
                                <span className="font-mono text-foreground">+{formatIndianCurrency(formData.stoneOtherCharges || 0)}</span>
                            </div>
                            <div className="pt-2 border-t border-dashed border-border/60 flex justify-between items-center text-[12px]">
                                <span className="text-muted-foreground font-medium">Subtotal</span>
                                <span className="font-mono font-medium text-foreground">{formatIndianCurrency(preview.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-muted-foreground">GST ({formData.gstPercent}%)</span>
                                <span className="font-mono text-[hsl(var(--loss))]">+{formatIndianCurrency(preview.gstAmount)}</span>
                            </div>

                            <div className="pt-4 mt-auto border-t border-border">
                                <p className="eyebrow text-muted-foreground mb-1">Total Cost Basis</p>
                                <p className="font-mono text-[24px] font-bold text-foreground">
                                    {formatIndianCurrency(preview.netAmount)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between">
                    {initialData && onDelete ? (
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={isSubmitting}
                            className="text-[11px] font-mono text-[hsl(var(--loss))] hover:underline disabled:opacity-50"
                        >
                            [ DELETE RECORD ]
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
                            form="gs-form"
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-accent min-w-[100px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Investment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
