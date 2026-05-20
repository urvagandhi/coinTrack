'use client';

import {
    CalculatorLayout,
    DisclaimerBanner,
    FormField,
    InputCard,
    ResultCard
} from '@/components/calculators/framework/CalculatorComponents';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { calculatorService, formatCurrency } from '@/lib/calculator.service';
import { useState } from 'react';

function RegimePanel({ title, items, total, recommended }) {
    return (
        <div
            className={cn(
                'bg-background border px-4 py-4 space-y-3',
                recommended ? 'border-[hsl(var(--gain))] border-l-[3px]' : 'border-hairline'
            )}
        >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-hairline">
                <p className="eyebrow-strong">{title}</p>
                {recommended && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--gain))]">
                        Recommended
                    </span>
                )}
            </div>
            <div className="space-y-2">
                {items.map((it) => (
                    <div key={it.label}>
                        <p className="font-mono uppercase tracking-[0.16em] text-[10px] text-muted-foreground">
                            {it.label}
                        </p>
                        <p className="font-mono tabular-nums text-[13px] text-foreground mt-0.5">{it.value}</p>
                    </div>
                ))}
            </div>
            <div className="pt-2.5 border-t border-hairline">
                <p className="eyebrow">Total tax</p>
                <p className="font-serif text-[24px] leading-[1.05] tracking-tight tabular-nums text-foreground mt-0.5">
                    {total}
                </p>
            </div>
        </div>
    );
}

export default function IncomeTaxCalculatorPage() {
    const [inputs, setInputs] = useState({
        grossIncome: 1200000,
        section80CDeductions: 150000,
        section80DDeductions: 25000,
        otherDeductions: 0,
        hraExemption: 0,
        financialYear: '2024-25'
    });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: name === 'financialYear' ? value : (parseFloat(value) || 0)
        }));
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.calculateIncomeTax(inputs);

            if (response.success) {
                setResult(response.result);
            } else {
                setError(response.error?.message || 'Calculation failed');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to calculate. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CalculatorLayout
            title="Income Tax Calculator"
            description="Compare your tax liability under Old and New Regime (India FY 2024-25)"
            category="Tax"
        >
            {/* Input Section */}
            <InputCard
                title="Enter Income Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Gross Annual Income"
                    name="grossIncome"
                    value={inputs.grossIncome}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={10000}
                />

                <FormField
                    label="Section 80C Deductions"
                    name="section80CDeductions"
                    value={inputs.section80CDeductions}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    max={150000}
                    step={5000}
                    tooltip="Max ₹1.5 Lakh (LIC, PPF, ELSS)"
                />

                <FormField
                    label="Section 80D Deductions"
                    name="section80DDeductions"
                    value={inputs.section80DDeductions}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    max={75000}
                    step={5000}
                    tooltip="Health Insurance (Max ₹25K-75K)"
                />

                <FormField
                    label="Other Deductions"
                    name="otherDeductions"
                    value={inputs.otherDeductions}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={5000}
                    tooltip="80E, 80G, etc."
                />

                {error && (
                    <div className="border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.05)] px-3 py-2.5 flex items-start gap-2">
                        <AlertCircle size={13} className="text-[hsl(var(--loss))] flex-shrink-0 mt-0.5" />
                        <p className="font-mono text-[12px] text-[hsl(var(--loss))] leading-snug">{error}</p>
                    </div>
                )}
            </InputCard>

            {/* Results Section */}
            <div className="space-y-4">
                <ResultCard title="Old vs New · The Comparison" isEmpty={!result}>
                    {result && (
                        <div className="space-y-5">
                            {/* Verdict */}
                            <div
                                className={cn(
                                    'border-l-2 px-4 py-3.5',
                                    result.recommendedRegime === 'NEW_REGIME'
                                        ? 'border-[hsl(var(--gain))] bg-[hsl(var(--gain)/0.05)]'
                                        : result.recommendedRegime === 'OLD_REGIME'
                                            ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.05)]'
                                            : 'border-foreground/70 bg-muted/30'
                                )}
                            >
                                <p className="eyebrow">The verdict</p>
                                <p className="font-serif text-[28px] leading-[1.05] tracking-tight text-foreground mt-0.5">
                                    {result.recommendedRegime === 'NEW_REGIME'
                                        ? 'New Regime'
                                        : result.recommendedRegime === 'OLD_REGIME'
                                            ? 'Old Regime'
                                            : 'Either Regime'}
                                </p>
                                {result.taxSavings > 0 && (
                                    <p className="mt-1 font-mono text-[12px] text-[hsl(var(--gain))] tabular-nums">
                                        Saves {formatCurrency(result.taxSavings)} a year
                                    </p>
                                )}
                            </div>

                            {/* Side by side comparison */}
                            <div className="grid grid-cols-2 gap-3">
                                <RegimePanel
                                    title="Old Regime"
                                    recommended={result.recommendedRegime === 'OLD_REGIME'}
                                    items={[
                                        { label: 'Taxable Income', value: formatCurrency(result.taxableIncomeOldRegime) },
                                        { label: 'Tax', value: formatCurrency(result.taxOldRegime) },
                                        { label: 'Cess (4%)', value: formatCurrency(result.cessOldRegime) },
                                    ]}
                                    total={formatCurrency(result.totalTaxOldRegime)}
                                />
                                <RegimePanel
                                    title="New Regime"
                                    recommended={result.recommendedRegime === 'NEW_REGIME'}
                                    items={[
                                        { label: 'Taxable Income', value: formatCurrency(result.taxableIncomeNewRegime) },
                                        { label: 'Tax', value: formatCurrency(result.taxNewRegime) },
                                        { label: 'Cess (4%)', value: formatCurrency(result.cessNewRegime) },
                                    ]}
                                    total={formatCurrency(result.totalTaxNewRegime)}
                                />
                            </div>
                        </div>
                    )}
                </ResultCard>

                {/* Disclaimer */}
                {result && (
                    <DisclaimerBanner
                        title="Important Disclaimer"
                        message={result.disclaimer}
                        variant="warning"
                    />
                )}
            </div>
        </CalculatorLayout>
    );
}
