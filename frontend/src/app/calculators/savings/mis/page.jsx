'use client';

import {
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency } from '@/lib/calculator.service';
import { useState } from 'react';

export default function MisCalculatorPage() {
    const [inputs, setInputs] = useState({
        investmentAmount: 450000
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
            const response = await calculatorService.calculateMis(inputs);

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
            title="Post Office MIS Calculator"
            description="Monthly Income Scheme returns calculator"
            category="Savings"
        >
            <InputCard
                title="Enter MIS Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Investment Amount"
                    name="investmentAmount"
                    value={inputs.investmentAmount}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1000}
                    max={900000}
                    step={10000}
                    tooltip="Max ₹9 Lakh (single), ₹15 Lakh (joint)"
                />

                <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-md">
                    <div className="flex justify-between">
                        <span>Current Interest Rate:</span>
                        <span className="font-medium">7.4% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Payout:</span>
                        <span className="font-medium">Monthly</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Lock-in:</span>
                        <span className="font-medium">5 Years</span>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Monthly Income" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(result.monthlyIncome)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Every month for 5 years</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Principal"
                                value={formatCurrency(result.investmentAmount)}
                            />
                            <ResultMetric
                                label="Yearly Income"
                                value={formatCurrency(result.yearlyIncome)}
                                variant="success"
                            />
                            <ResultMetric
                                label="Total Interest (5yr)"
                                value={formatCurrency(result.totalInterest)}
                                variant="success"
                            />
                            <ResultMetric
                                label="At Maturity"
                                value={formatCurrency(result.investmentAmount)}
                                subValue="Principal returned"
                            />
                        </div>

                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Note:</strong> Interest is taxable. No TDS if below threshold. Principal is returned at maturity.
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
