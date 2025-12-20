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

export default function FdCalculatorPage() {
    const [inputs, setInputs] = useState({
        principal: 100000,
        interestRate: 7.0,
        tenureDays: 365,
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
            const response = await calculatorService.calculateFd(inputs);

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

    const years = Math.floor(inputs.tenureDays / 365);
    const months = Math.floor((inputs.tenureDays % 365) / 30);

    return (
        <CalculatorLayout
            title="FD Calculator"
            description="Calculate Fixed Deposit maturity amount"
            category="Savings"
        >
            <InputCard
                title="Enter FD Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Principal Amount"
                    name="principal"
                    value={inputs.principal}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1000}
                    max={1000000000}
                    step={10000}
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
                    name="tenureDays"
                    value={inputs.tenureDays}
                    onChange={handleInputChange}
                    suffix="Days"
                    min={7}
                    max={3650}
                    step={30}
                    tooltip={`${years} years ${months} months`}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Your FD Maturity" isEmpty={!result}>
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
                            />
                            <ResultMetric
                                label="Tenure"
                                value={`${years}Y ${months}M`}
                            />
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
