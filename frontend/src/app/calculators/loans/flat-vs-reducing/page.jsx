'use client';

import {
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard
} from '@/components/calculators/framework/CalculatorComponents';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { calculatorService, formatCurrency, formatPercentage } from '@/lib/calculator.service';
import { useState } from 'react';

function ComparisonPanel({ title, items, highlighted }) {
    return (
        <div
            className={cn(
                'bg-background border px-4 py-4 space-y-2.5',
                highlighted ? 'border-[hsl(var(--gain))] border-l-[3px]' : 'border-hairline'
            )}
        >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-hairline">
                <p className="eyebrow-strong">{title}</p>
                {highlighted && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--gain))]">
                        Better
                    </span>
                )}
            </div>
            {items.map((it) => (
                <div key={it.label} className="flex items-baseline justify-between gap-3 text-[12px]">
                    <span className="font-mono uppercase tracking-[0.16em] text-[10px] text-muted-foreground">
                        {it.label}
                    </span>
                    <span className="font-mono tabular-nums text-foreground">{it.value}</span>
                </div>
            ))}
        </div>
    );
}

export default function FlatVsReducingCalculatorPage() {
    const [inputs, setInputs] = useState({
        principal: 1000000,
        annualRate: 10,
        months: 60
    });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.compareFlatVsReducing(inputs);

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

    const years = Math.floor(inputs.months / 12);

    return (
        <CalculatorLayout
            title="Flat vs Reducing Rate"
            description="Compare flat rate and reducing balance EMI methods"
            category="Loans"
        >
            <InputCard
                title="Enter Loan Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Loan Amount"
                    name="principal"
                    value={inputs.principal}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={10000}
                    max={100000000}
                    step={50000}
                />

                <FormField
                    label="Stated Interest Rate"
                    name="annualRate"
                    value={inputs.annualRate}
                    onChange={handleInputChange}
                    suffix="%"
                    min={1}
                    max={30}
                    step={0.5}
                />

                <FormField
                    label="Loan Tenure"
                    name="months"
                    value={inputs.months}
                    onChange={handleInputChange}
                    suffix="Months"
                    min={12}
                    max={360}
                    step={12}
                    tooltip={`${years} years`}
                />

                {error && (
                    <div className="border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.05)] px-3 py-2.5 flex items-start gap-2">
                        <AlertCircle size={13} className="text-[hsl(var(--loss))] flex-shrink-0 mt-0.5" />
                        <p className="font-mono text-[12px] text-[hsl(var(--loss))] leading-snug">{error}</p>
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="The Comparison" isEmpty={!result}>
                    {result && (
                        <div className="space-y-5">
                            {/* Verdict */}
                            <div className="border-l-2 border-[hsl(var(--gain))] bg-[hsl(var(--gain)/0.05)] px-4 py-3.5">
                                <p className="eyebrow">The verdict</p>
                                <p className="font-serif text-[28px] leading-[1.05] tracking-tight text-foreground mt-0.5">
                                    {result.reducingIsBetter ? 'Reducing Balance' : 'Flat Rate'}
                                </p>
                                <p className="mt-1 font-mono text-[12px] text-[hsl(var(--gain))] tabular-nums">
                                    Saves {formatCurrency(result.savings)} over the tenure
                                </p>
                            </div>

                            {/* Side by side */}
                            <div className="grid grid-cols-2 gap-3">
                                <ComparisonPanel
                                    title="Flat Rate"
                                    highlighted={!result.reducingIsBetter}
                                    items={[
                                        { label: 'EMI', value: formatCurrency(result.flatEmi) },
                                        { label: 'Interest', value: formatCurrency(result.flatTotalInterest) },
                                        { label: 'Total', value: formatCurrency(result.flatTotalPayment) },
                                    ]}
                                />
                                <ComparisonPanel
                                    title="Reducing Balance"
                                    highlighted={result.reducingIsBetter}
                                    items={[
                                        { label: 'EMI', value: formatCurrency(result.reducingEmi) },
                                        { label: 'Interest', value: formatCurrency(result.reducingTotalInterest) },
                                        { label: 'Total', value: formatCurrency(result.reducingTotalPayment) },
                                    ]}
                                />
                            </div>

                            <div className="border-l-2 border-foreground/70 pl-4 py-1">
                                <p className="eyebrow-strong mb-1">Effective rate</p>
                                <p className="font-serif italic text-[14px] text-muted-foreground leading-snug">
                                    A <span className="not-italic font-mono text-foreground tabular-nums">{inputs.annualRate}%</span> flat
                                    rate is equivalent to about{' '}
                                    <span className="not-italic font-mono text-foreground tabular-nums">
                                        {formatPercentage(result.effectiveReducingRate)}
                                    </span>{' '}
                                    on a reducing balance basis.
                                </p>
                            </div>
                        </div>
                    )}
                </ResultCard>
            </div>
        </CalculatorLayout>
    );
}
