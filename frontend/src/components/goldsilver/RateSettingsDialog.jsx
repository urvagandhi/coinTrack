'use client';

import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, Sliders, Info, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { goldSilverAPI } from '@/lib/api';

const DEFAULT_DUTY_PREMIUM = 15.00; // 15% Statutory Import Duty

export default function RateSettingsDialog({ isOpen, onClose, onSaved }) {
    const [spotGold, setSpotGold] = useState(null); // baseRatePerGram
    const [spotSilver, setSpotSilver] = useState(null);

    // Mode: 'RATE' (enter local 24K/999 rate) or 'PERCENT' (enter premium %)
    const [inputMode, setInputMode] = useState('RATE');

    const [goldRetailRate, setGoldRetailRate] = useState('');
    const [goldPremium, setGoldPremium] = useState('15.00');

    const [silverRetailRate, setSilverRetailRate] = useState('');
    const [silverPremium, setSilverPremium] = useState('15.00');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingRates, setIsFetchingRates] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setIsFetchingRates(true);
            Promise.all([
                goldSilverAPI.getCurrentRates().catch(() => []),
                goldSilverAPI.getRateSettings().catch(() => null),
            ]).then(([rates, settings]) => {
                const goldSnap = rates?.find(r => r.metalType === 'GOLD');
                const silverSnap = rates?.find(r => r.metalType === 'SILVER');

                const goldBase = goldSnap?.baseRatePerGram || 6400;
                const silverBase = silverSnap?.baseRatePerGram || 75;

                setSpotGold(goldBase);
                setSpotSilver(silverBase);

                const currentGoldPrem = settings?.goldLocalPremiumPercent ?? goldSnap?.localPremiumPercent ?? DEFAULT_DUTY_PREMIUM;
                const currentSilverPrem = settings?.silverLocalPremiumPercent ?? silverSnap?.localPremiumPercent ?? DEFAULT_DUTY_PREMIUM;

                setGoldPremium(currentGoldPrem.toFixed(2));
                setSilverPremium(currentSilverPrem.toFixed(2));

                // Compute effective local retail rates
                setGoldRetailRate((goldBase * (1 + currentGoldPrem / 100)).toFixed(2));
                setSilverRetailRate((silverBase * (1 + currentSilverPrem / 100)).toFixed(2));
            }).finally(() => {
                setIsFetchingRates(false);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Handler when user edits Gold Local Rate (₹/g)
    const handleGoldRateChange = (val) => {
        setGoldRetailRate(val);
        const numRate = parseFloat(val);
        if (!isNaN(numRate) && numRate > 0 && spotGold && spotGold > 0) {
            const prem = ((numRate / spotGold) - 1) * 100;
            setGoldPremium(prem > 0 ? prem.toFixed(2) : '0.00');
        }
    };

    // Handler when user edits Gold Premium %
    const handleGoldPremiumChange = (val) => {
        setGoldPremium(val);
        const numPrem = parseFloat(val);
        if (!isNaN(numPrem) && spotGold && spotGold > 0) {
            const effective = spotGold * (1 + numPrem / 100);
            setGoldRetailRate(effective.toFixed(2));
        }
    };

    // Handler when user edits Silver Local Rate (₹/g)
    const handleSilverRateChange = (val) => {
        setSilverRetailRate(val);
        const numRate = parseFloat(val);
        if (!isNaN(numRate) && numRate > 0 && spotSilver && spotSilver > 0) {
            const prem = ((numRate / spotSilver) - 1) * 100;
            setSilverPremium(prem > 0 ? prem.toFixed(2) : '0.00');
        }
    };

    // Handler when user edits Silver Premium %
    const handleSilverPremiumChange = (val) => {
        setSilverPremium(val);
        const numPrem = parseFloat(val);
        if (!isNaN(numPrem) && spotSilver && spotSilver > 0) {
            const effective = spotSilver * (1 + numPrem / 100);
            setSilverRetailRate(effective.toFixed(2));
        }
    };

    const handleResetDefault = () => {
        handleGoldPremiumChange('15.00');
        handleSilverPremiumChange('15.00');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let goldPremVal = parseFloat(goldPremium);
        let silverPremVal = parseFloat(silverPremium);

        if (isNaN(goldPremVal) || goldPremVal < 0) goldPremVal = DEFAULT_DUTY_PREMIUM;
        if (isNaN(silverPremVal) || silverPremVal < 0) silverPremVal = DEFAULT_DUTY_PREMIUM;

        setIsSubmitting(true);
        try {
            await goldSilverAPI.updateRateSettings({
                goldLocalPremiumPercent: goldPremVal,
                silverLocalPremiumPercent: silverPremVal,
            });
            toast({ title: 'Market Rates Calibrated', description: 'Holdings recomputed using calibrated local rate anchor.', variant: 'success' });
            if (onSaved) onSaved();
            onClose();
        } catch (error) {
            console.error('Error saving rate settings:', error);
            toast({ title: 'Update Failed', description: error?.message || 'Failed to update settings.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="ed-card w-full max-w-lg relative flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />

                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <Sliders className="h-5 w-5 text-[hsl(var(--accent))]" />
                        <div>
                            <h2 className="font-serif text-[20px] text-foreground leading-none mb-1">
                                Local Market Calibration
                            </h2>
                            <p className="text-[12px] text-muted-foreground font-mono tracking-[0.05em]">
                                Indian Jeweller & Duty Calibration
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

                <div className="p-6 space-y-6">
                    <div className="p-3 border border-border/80 rounded-sm bg-muted/20 text-[11px] font-mono text-muted-foreground leading-relaxed flex items-start gap-2">
                        <Info className="h-4 w-4 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
                        <span>
                            Defaults to <strong className="text-foreground">15.00% statutory import duty</strong>. Enter today's local jeweller 24K rate in your city (e.g. Goodreturns) to automatically calibrate live spot market feeds.
                        </span>
                    </div>

                    {/* Calibration Input Toggle */}
                    <div className="flex items-center justify-between bg-muted/30 p-1 border border-border rounded-sm">
                        <span className="eyebrow text-muted-foreground ml-2">Input Mode:</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setInputMode('RATE')}
                                className={`px-3 py-1 text-[11px] font-mono rounded-xs transition-colors ${inputMode === 'RATE' ? 'bg-foreground text-background shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Local City Rate (₹/g)
                            </button>
                            <button
                                type="button"
                                onClick={() => setInputMode('PERCENT')}
                                className={`px-3 py-1 text-[11px] font-mono rounded-xs transition-colors ${inputMode === 'PERCENT' ? 'bg-foreground text-background shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Premium %
                            </button>
                        </div>
                    </div>

                    <form id="rate-settings-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Gold Section */}
                        <div className="p-4 border border-border rounded-sm bg-card space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="eyebrow flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    Gold Rate Calibration
                                </label>
                                {spotGold && (
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                        Global Spot: ₹{spotGold.toFixed(2)}/g
                                    </span>
                                )}
                            </div>

                            {inputMode === 'RATE' ? (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                                        <span>Actual Local 24K Retail Rate (₹/g)</span>
                                        <span className="text-[hsl(var(--accent))]">Calculated Premium: +{goldPremium}%</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        required
                                        value={goldRetailRate}
                                        onChange={(e) => handleGoldRateChange(e.target.value)}
                                        className="ed-input w-full font-mono text-[16px] font-bold text-foreground"
                                        placeholder="e.g. 7360.00"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                                        <span>Local Premium % over Spot Benchmark</span>
                                        <span className="text-foreground">Calibrated Rate: ₹{goldRetailRate}/g</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={goldPremium}
                                        onChange={(e) => handleGoldPremiumChange(e.target.value)}
                                        className="ed-input w-full font-mono text-[16px] font-bold text-foreground"
                                        placeholder="15.00"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Silver Section */}
                        <div className="p-4 border border-border rounded-sm bg-card space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="eyebrow flex items-center gap-1.5 font-semibold text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    Silver Rate Calibration
                                </label>
                                {spotSilver && (
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                        Global Spot: ₹{spotSilver.toFixed(2)}/g
                                    </span>
                                )}
                            </div>

                            {inputMode === 'RATE' ? (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                                        <span>Actual Local 999 Silver Rate (₹/g)</span>
                                        <span className="text-[hsl(var(--accent))]">Calculated Premium: +{silverPremium}%</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        required
                                        value={silverRetailRate}
                                        onChange={(e) => handleSilverRateChange(e.target.value)}
                                        className="ed-input w-full font-mono text-[16px] font-bold text-foreground"
                                        placeholder="e.g. 86.25"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                                        <span>Local Premium % over Spot Benchmark</span>
                                        <span className="text-foreground">Calibrated Rate: ₹{silverRetailRate}/g</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={silverPremium}
                                        onChange={(e) => handleSilverPremiumChange(e.target.value)}
                                        className="ed-input w-full font-mono text-[16px] font-bold text-foreground"
                                        placeholder="15.00"
                                    />
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between gap-3 mt-auto">
                    <button
                        type="button"
                        onClick={handleResetDefault}
                        className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                        title="Reset to 15.00% statutory import duty"
                    >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset to 15% Duty</span>
                    </button>

                    <div className="flex items-center gap-3">
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
                            form="rate-settings-form"
                            disabled={isSubmitting || isFetchingRates}
                            className="ed-btn ed-btn-accent min-w-[130px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calibrate Rates'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
