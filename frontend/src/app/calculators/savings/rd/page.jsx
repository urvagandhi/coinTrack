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

export default function RdCalculatorPage() {
    const [inputs, setInputs] = useState({
        monthlyDeposit: 5000,
        interestRate: 6.5,
        tenureMonths: 60
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
            const response = await calculatorService.calculateRd(inputs);

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

    const years = Math.floor(inputs.tenureMonths / 12);
    const months = inputs.tenureMonths % 12;

    return (
        <CalculatorLayout
            title="RD Calculator"
            description="Calculate Recurring Deposit maturity amount"
            category="Savings"
        >
            <InputCard
                title="Enter RD Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Monthly Deposit"
                    name="monthlyDeposit"
                    value={inputs.monthlyDeposit}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={100}
                    max={1000000}
                    step={500}
                />

                <FormField
                    label="Interest Rate"
                    name="interestRate"
                    value={inputs.interestRate}
                    onChange={handleInputChange}
                    suffix="%"
                    min={1}
                    max={15}
                    step={0.1}
                />

                <FormField
                    label="Tenure"
                    name="tenureMonths"
                    value={inputs.tenureMonths}
                    onChange={handleInputChange}
                    suffix="Months"
                    min={6}
                    max={120}
                    step={6}
                    tooltip={`${years} years ${months > 0 ? months + ' months' : ''}`}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Your RD Maturity" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Maturity Amount</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.maturityAmount)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Total Deposits"
                                value={formatCurrency(result.totalDeposits)}
                            />
                            <ResultMetric
                                label="Interest Earned"
                                value={formatCurrency(result.totalInterest)}
                                variant="success"
                            />
                            <ResultMetric
                                label="Monthly Deposit"
                                value={formatCurrency(inputs.monthlyDeposit)}
                            />
                            <ResultMetric
                                label="Tenure"
                                value={`${years}Y ${months > 0 ? months + 'M' : ''}`}
                            />
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
