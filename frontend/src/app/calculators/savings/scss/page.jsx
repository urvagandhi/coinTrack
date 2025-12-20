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

export default function ScssCalculatorPage() {
    const [inputs, setInputs] = useState({
        investmentAmount: 1500000
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
            const response = await calculatorService.calculateScss(inputs);

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
            title="SCSS Calculator"
            description="Senior Citizens Savings Scheme returns calculator"
            category="Savings"
        >
            <InputCard
                title="Enter SCSS Details"
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
                    max={3000000}
                    step={50000}
                    tooltip="Max ₹30 Lakh"
                />

                <div className="space-y-2 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-green-800 dark:text-green-200">
                    <div className="flex justify-between">
                        <span>Current Interest Rate:</span>
                        <span className="font-medium">8.2% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Interest Payout:</span>
                        <span className="font-medium">Quarterly</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tenure:</span>
                        <span className="font-medium">5 Years (extendable by 3)</span>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="SCSS Returns" isEmpty={!result}>
                    {result && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-primary/10 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Quarterly Interest</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatCurrency(result.quarterlyInterest)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Monthly Equivalent</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(result.quarterlyInterest / 3)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ResultMetric
                                    label="Principal"
                                    value={formatCurrency(result.investmentAmount)}
                                />
                                <ResultMetric
                                    label="Yearly Interest"
                                    value={formatCurrency(result.yearlyInterest)}
                                    variant="success"
                                />
                                <ResultMetric
                                    label="5-Year Interest"
                                    value={formatCurrency(result.totalInterest)}
                                    variant="success"
                                />
                                <ResultMetric
                                    label="Maturity (5yr)"
                                    value={formatCurrency(result.maturityAmount)}
                                />
                            </div>
                        </div>
                    )}
                </ResultCard>

                <DisclaimerBanner
                    title="Eligibility"
                    message="Available for individuals aged 60+ years. Early retirees (55-60) from government service are also eligible. Tax benefit under Sec 80C up to ₹1.5 Lakh."
                    variant="info"
                />
            </div>
        </CalculatorLayout>
    );
}
