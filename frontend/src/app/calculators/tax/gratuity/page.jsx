'use client';

import {
    CalculatorLayout,
    DisclaimerBanner,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency } from '@/lib/calculator.service';
import { useState } from 'react';

export default function GratuityCalculatorPage() {
    const [inputs, setInputs] = useState({
        lastDrawnSalary: 50000,
        yearsOfService: 10
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
            const response = await calculatorService.calculateGratuity(inputs);

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
            title="Gratuity Calculator"
            description="Calculate your gratuity amount as per Payment of Gratuity Act"
            category="Tax"
        >
            <InputCard
                title="Enter Employment Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Last Drawn Salary"
                    name="lastDrawnSalary"
                    value={inputs.lastDrawnSalary}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1000}
                    step={5000}
                    tooltip="Basic + DA"
                />

                <FormField
                    label="Years of Service"
                    name="yearsOfService"
                    value={inputs.yearsOfService}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={1}
                    max={50}
                    step={1}
                />

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <strong>Note:</strong> Minimum 5 years of continuous service required for gratuity eligibility.
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="Your Gratuity Amount" isEmpty={!result}>
                    {result && (
                        <div className="space-y-6">
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Gratuity Payable</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(result.gratuityAmount)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ResultMetric
                                    label="Last Drawn Salary"
                                    value={formatCurrency(result.lastDrawnSalary)}
                                />
                                <ResultMetric
                                    label="Years of Service"
                                    value={`${result.yearsOfService} years`}
                                />
                            </div>

                            <div className="p-3 bg-muted/50 rounded-md text-sm">
                                <p className="font-medium mb-2">Formula (Under Gratuity Act):</p>
                                <p className="text-muted-foreground">
                                    Gratuity = (Last Salary × 15 × Years) / 26
                                </p>
                            </div>

                            {result.isTaxExempt && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-800 dark:text-green-200">
                                    ✓ Tax-exempt up to ₹20 Lakh under current rules
                                </div>
                            )}
                        </div>
                    )}
                </ResultCard>

                {result && (
                    <DisclaimerBanner
                        title="Eligibility Criteria"
                        message="Gratuity is payable to employees who have completed at least 5 years of continuous service. The formula and limits may vary for government employees."
                        variant="info"
                    />
                )}
            </div>
        </CalculatorLayout>
    );
}
