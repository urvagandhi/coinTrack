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

export default function CagrCalculatorPage() {
    const [inputs, setInputs] = useState({
        initialValue: 100000,
        finalValue: 200000,
        years: 5
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
            const response = await calculatorService.calculateCagr(inputs);

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
            title="CAGR Calculator"
            description="Calculate Compound Annual Growth Rate of your investment"
            category="Investment"
        >
            <InputCard
                title="Enter Investment Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Initial Value"
                    name="initialValue"
                    value={inputs.initialValue}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1}
                    max={1000000000}
                    step={10000}
                    tooltip="Starting investment value"
                />

                <FormField
                    label="Final Value"
                    name="finalValue"
                    value={inputs.finalValue}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1}
                    max={1000000000}
                    step={10000}
                    tooltip="Current/ending value"
                />

                <FormField
                    label="Investment Period"
                    name="years"
                    value={inputs.years}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={1}
                    max={50}
                    step={1}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Your CAGR Results" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">CAGR</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatPercentage(result.cagr)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Initial Value"
                                value={formatCurrency(inputs.initialValue)}
                            />
                            <ResultMetric
                                label="Final Value"
                                value={formatCurrency(inputs.finalValue)}
                            />
                            <ResultMetric
                                label="Absolute Return"
                                value={formatCurrency(inputs.finalValue - inputs.initialValue)}
                                variant={inputs.finalValue > inputs.initialValue ? 'success' : 'error'}
                            />
                            <ResultMetric
                                label="Absolute %"
                                value={formatPercentage(((inputs.finalValue - inputs.initialValue) / inputs.initialValue) * 100)}
                                variant={inputs.finalValue > inputs.initialValue ? 'success' : 'error'}
                            />
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
