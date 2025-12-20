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
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Inflation Impact" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Future Value</p>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(result.futureValue)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                After {inputs.years} years
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
