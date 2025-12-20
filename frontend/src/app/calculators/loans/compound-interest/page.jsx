'use client';

import {
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency, formatPercentage } from '@/lib/calculator.service';
import { useState } from 'react';

export default function CompoundInterestCalculatorPage() {
    const [inputs, setInputs] = useState({
        principal: 100000,
        annualRate: 8,
        years: 5,
        compoundingFrequency: 4 // Quarterly
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
            const response = await calculatorService.calculateCompoundInterest(inputs);

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

    const frequencies = [
        { id: 1, name: 'Yearly' },
        { id: 2, name: 'Half-Yearly' },
        { id: 4, name: 'Quarterly' },
        { id: 12, name: 'Monthly' },
    ];

    return (
        <CalculatorLayout
            title="Compound Interest Calculator"
            description="Calculate compound interest with various compounding frequencies"
            category="Loans"
        >
            <InputCard
                title="Enter Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Principal Amount"
                    name="principal"
                    value={inputs.principal}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={100}
                    step={10000}
                />

                <FormField
                    label="Annual Interest Rate"
                    name="annualRate"
                    value={inputs.annualRate}
                    onChange={handleInputChange}
                    suffix="%"
                    min={0.1}
                    max={50}
                    step={0.5}
                />

                <FormField
                    label="Time Period"
                    name="years"
                    value={inputs.years}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={1}
                    max={50}
                    step={1}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium">Compounding Frequency</label>
                    <div className="grid grid-cols-2 gap-2">
                        {frequencies.map(freq => (
                            <button
                                key={freq.id}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, compoundingFrequency: freq.id }))}
                                className={`py-2 px-3 text-sm rounded-md border transition-colors
                                    ${inputs.compoundingFrequency === freq.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'}`}
                            >
                                {freq.name}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Compound Interest Results" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.totalAmount)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Principal"
                                value={formatCurrency(result.principal)}
                            />
                            <ResultMetric
                                label="Interest Earned"
                                value={formatCurrency(result.totalInterest)}
                                variant="success"
                            />
                            <ResultMetric
                                label="Effective Rate"
                                value={formatPercentage(result.effectiveRate)}
                                subValue="Annual"
                            />
                            <ResultMetric
                                label="Growth"
                                value={formatPercentage((result.totalInterest / inputs.principal) * 100)}
                                subValue="Total"
                            />
                        </div>

                        <div className="p-3 bg-muted/50 rounded-md text-sm">
                            <p className="font-medium mb-2">Formula:</p>
                            <p className="text-muted-foreground">
                                A = P × (1 + r/n)^(n×t)
                            </p>
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
