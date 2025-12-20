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

export default function NpsCalculatorPage() {
    const [inputs, setInputs] = useState({
        monthlyContribution: 5000,
        currentAge: 30,
        retirementAge: 60,
        expectedReturn: 10,
        annuityPercent: 40
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
            const response = await calculatorService.calculateNps(inputs);

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

    const yearsToRetirement = inputs.retirementAge - inputs.currentAge;

    return (
        <CalculatorLayout
            title="NPS Calculator"
            description="Calculate your National Pension System corpus and pension"
            category="Savings"
        >
            <InputCard
                title="Enter NPS Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Monthly Contribution"
                    name="monthlyContribution"
                    value={inputs.monthlyContribution}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={500}
                    step={500}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Current Age"
                        name="currentAge"
                        value={inputs.currentAge}
                        onChange={handleInputChange}
                        suffix="Years"
                        min={18}
                        max={65}
                        step={1}
                    />

                    <FormField
                        label="Retirement Age"
                        name="retirementAge"
                        value={inputs.retirementAge}
                        onChange={handleInputChange}
                        suffix="Years"
                        min={60}
                        max={75}
                        step={1}
                    />
                </div>

                <FormField
                    label="Expected Return"
                    name="expectedReturn"
                    value={inputs.expectedReturn}
                    onChange={handleInputChange}
                    suffix="%"
                    min={5}
                    max={15}
                    step={0.5}
                    tooltip="8-10% typical"
                />

                <FormField
                    label="Annuity Purchase"
                    name="annuityPercent"
                    value={inputs.annuityPercent}
                    onChange={handleInputChange}
                    suffix="%"
                    min={40}
                    max={100}
                    step={10}
                    tooltip="Min 40% mandatory"
                />

                <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-blue-800 dark:text-blue-200">
                    <strong>Tax Benefit:</strong> Up to ₹2 Lakh under Sec 80CCD(1) + 80CCD(1B)
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Your NPS Projection" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Total Corpus at Retirement</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.totalCorpus)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Total Investment"
                                value={formatCurrency(result.totalInvestment)}
                            />
                            <ResultMetric
                                label="Total Gains"
                                value={formatCurrency(result.totalGains)}
                                variant="success"
                            />
                            <ResultMetric
                                label="Lump Sum (60%)"
                                value={formatCurrency(result.lumpSumAmount)}
                                subValue="Tax-free"
                            />
                            <ResultMetric
                                label="For Annuity (40%)"
                                value={formatCurrency(result.annuityAmount)}
                            />
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Estimated Monthly Pension: {formatCurrency(result.estimatedPension)}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Based on 6% annuity rate
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Years to Retirement"
                                value={`${yearsToRetirement} years`}
                            />
                            <ResultMetric
                                label="Yearly Tax Saved"
                                value={formatCurrency(result.yearlyTaxBenefit)}
                                subValue="Est. at 30% slab"
                            />
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
