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

export default function InflationCalculatorPage() {
    const [inputs, setInputs] = useState({
        presentValue: 100000,
        inflationRate: 6,
        years: 10
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
            const response = await calculatorService.calculateInflation(inputs);

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
            title="Inflation Calculator"
            description="Calculate the future cost of goods considering inflation"
            category="Investment"
        >
            <InputCard
                title="Enter Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Present Value"
                    name="presentValue"
                    value={inputs.presentValue}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1}
                    step={10000}
                    tooltip="Current cost of the item/expense"
                />

                <FormField
                    label="Expected Inflation Rate"
                    name="inflationRate"
                    value={inputs.inflationRate}
                    onChange={handleInputChange}
                    suffix="%"
                    min={1}
                    max={30}
                    step={0.5}
                    tooltip="Average 6-7% in India"
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

                {error && (
                    <div className="border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.05)] px-3 py-2.5">
                        <p className="font-mono text-[12px] text-[hsl(var(--loss))] leading-snug">{error}</p>
                    </div>
                )}
            </InputCard>

            <ResultCard title="Inflation Impact" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.05)] px-4 py-3.5">
                            <p className="eyebrow">Future value</p>
                            <p className="font-serif text-[clamp(28px,3.6vw,36px)] leading-[1.05] tracking-tight tabular-nums text-[hsl(var(--loss))] mt-1">
                                {formatCurrency(result.futureValue)}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground mt-1">
                                After {inputs.years} years of erosion
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Present Value"
                                value={formatCurrency(inputs.presentValue)}
                            />
                            <ResultMetric
                                label="Increase"
                                value={formatCurrency(result.futureValue - inputs.presentValue)}
                                variant="error"
                            />
                            <ResultMetric
                                label="Inflation Rate"
                                value={formatPercentage(inputs.inflationRate)}
                            />
                            <ResultMetric
                                label="Purchasing Power Loss"
                                value={formatPercentage(result.purchasingPowerLoss)}
                                variant="error"
                            />
                        </div>

                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">What this means:</p>
                            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                                What costs {formatCurrency(inputs.presentValue)} today will cost {formatCurrency(result.futureValue)} in {inputs.years} years.
                            </p>
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
