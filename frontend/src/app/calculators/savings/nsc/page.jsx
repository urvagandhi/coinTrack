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

export default function NscCalculatorPage() {
    const [inputs, setInputs] = useState({
        investmentAmount: 100000
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
            const response = await calculatorService.calculateNsc(inputs);

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
            title="NSC Calculator"
            description="Calculate National Savings Certificate maturity amount"
            category="Savings"
        >
            <InputCard
                title="Enter NSC Details"
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
                    step={5000}
                    tooltip="Min ₹1,000, no max limit"
                />

                <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-md">
                    <div className="flex justify-between">
                        <span>Current Interest Rate:</span>
                        <span className="font-medium">7.7% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Lock-in Period:</span>
                        <span className="font-medium">5 Years</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Compounding:</span>
                        <span className="font-medium">Yearly</span>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="NSC Maturity" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Maturity Amount</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.maturityAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">After 5 years</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Investment"
                                value={formatCurrency(result.investmentAmount)}
                            />
                            <ResultMetric
                                label="Interest Earned"
                                value={formatCurrency(result.totalInterest)}
                                variant="success"
                            />
                            <ResultMetric
                                label="Tax Benefit"
                                value="Sec 80C"
                                subValue="Up to ₹1.5L"
                            />
                            <ResultMetric
                                label="Interest Taxable"
                                value="Yes"
                                subValue="Added to income"
                            />
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
