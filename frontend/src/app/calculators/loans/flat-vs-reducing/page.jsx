'use client';

import {
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard
} from '@/components/calculators/framework/CalculatorComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculatorService, formatCurrency, formatPercentage } from '@/lib/calculator.service';
import { useState } from 'react';

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
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="Comparison" isEmpty={!result}>
                    {result && (
                        <div className="space-y-4">
                            {/* Recommendation */}
                            <div className={`p-4 rounded-lg text-center ${result.reducingIsBetter
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200'
                                }`}>
                                <p className="text-sm font-medium">Better Option</p>
                                <p className="text-lg font-bold">
                                    {result.reducingIsBetter ? 'Reducing Balance' : 'Flat Rate'}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Save {formatCurrency(result.savings)}
                                </p>
                            </div>

                            {/* Side by side */}
                            <div className="grid grid-cols-2 gap-3">
                                <Card className={!result.reducingIsBetter ? 'border-green-500' : ''}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Flat Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>EMI</span>
                                            <span className="font-medium">{formatCurrency(result.flatEmi)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Interest</span>
                                            <span className="font-medium">{formatCurrency(result.flatTotalInterest)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total</span>
                                            <span className="font-medium">{formatCurrency(result.flatTotalPayment)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={result.reducingIsBetter ? 'border-green-500' : ''}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Reducing Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>EMI</span>
                                            <span className="font-medium">{formatCurrency(result.reducingEmi)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Interest</span>
                                            <span className="font-medium">{formatCurrency(result.reducingTotalInterest)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total</span>
                                            <span className="font-medium">{formatCurrency(result.reducingTotalPayment)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="p-3 bg-muted/50 rounded-md text-sm">
                                <p className="font-medium">Effective Interest Rate:</p>
                                <p className="text-muted-foreground mt-1">
                                    A {inputs.annualRate}% flat rate ≈ {formatPercentage(result.effectiveReducingRate)} reducing balance rate
                                </p>
                            </div>
                        </div>
                    )}
                </ResultCard>
            </div>
        </CalculatorLayout>
    );
}
