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

export default function RetirementCalculatorPage() {
    const [inputs, setInputs] = useState({
        currentAge: 30,
        retirementAge: 60,
        lifeExpectancy: 85,
        currentMonthlyExpense: 50000,
        expectedInflation: 6,
        preRetirementReturn: 12,
        postRetirementReturn: 8,
        currentSavings: 500000
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
            const response = await calculatorService.calculateRetirement(inputs);

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
    const retirementYears = inputs.lifeExpectancy - inputs.retirementAge;

    return (
        <CalculatorLayout
            title="Retirement Calculator"
            description="Plan your retirement corpus and monthly savings"
            category="Planning"
        >
            <InputCard
                title="Enter Your Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Current Age"
                        name="currentAge"
                        value={inputs.currentAge}
                        onChange={handleInputChange}
                        suffix="Years"
                        min={18}
                        max={70}
                        step={1}
                    />

                    <FormField
                        label="Retirement Age"
                        name="retirementAge"
                        value={inputs.retirementAge}
                        onChange={handleInputChange}
                        suffix="Years"
                        min={40}
                        max={80}
                        step={1}
                    />
                </div>

                <FormField
                    label="Life Expectancy"
                    name="lifeExpectancy"
                    value={inputs.lifeExpectancy}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={60}
                    max={100}
                    step={1}
                />

                <FormField
                    label="Current Monthly Expense"
                    name="currentMonthlyExpense"
                    value={inputs.currentMonthlyExpense}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={10000}
                    step={5000}
                />

                <FormField
                    label="Current Savings"
                    name="currentSavings"
                    value={inputs.currentSavings}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={50000}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Expected Inflation"
                        name="expectedInflation"
                        value={inputs.expectedInflation}
                        onChange={handleInputChange}
                        suffix="%"
                        min={1}
                        max={15}
                        step={0.5}
                    />

                    <FormField
                        label="Pre-Retirement Return"
                        name="preRetirementReturn"
                        value={inputs.preRetirementReturn}
                        onChange={handleInputChange}
                        suffix="%"
                        min={1}
                        max={20}
                        step={0.5}
                    />
                </div>

                <FormField
                    label="Post-Retirement Return"
                    name="postRetirementReturn"
                    value={inputs.postRetirementReturn}
                    onChange={handleInputChange}
                    suffix="%"
                    min={1}
                    max={15}
                    step={0.5}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="Your Retirement Plan" isEmpty={!result}>
                    {result && (
                        <div className="space-y-6">
                            <div className="text-center p-4 bg-primary/10 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Required Retirement Corpus</p>
                                <p className="text-3xl font-bold text-primary">
                                    {formatCurrency(result.requiredCorpus)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ResultMetric
                                    label="Monthly SIP Needed"
                                    value={formatCurrency(result.monthlySipRequired)}
                                    variant="warning"
                                />
                                <ResultMetric
                                    label="Expense at Retirement"
                                    value={formatCurrency(result.expenseAtRetirement)}
                                    subValue="Monthly (inflation adjusted)"
                                />
                                <ResultMetric
                                    label="Years to Retirement"
                                    value={`${yearsToRetirement} years`}
                                />
                                <ResultMetric
                                    label="Retirement Period"
                                    value={`${retirementYears} years`}
                                />
                            </div>

                            <div className="p-3 bg-muted/50 rounded-md space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Current Savings Growth</span>
                                    <span className="font-medium">{formatCurrency(result.currentSavingsGrowth)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Additional Corpus Needed</span>
                                    <span className="font-medium">{formatCurrency(result.additionalCorpusNeeded)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </ResultCard>

                {result && (
                    <DisclaimerBanner
                        title="Important Note"
                        message="This is an estimate based on assumed inflation and return rates. Actual requirements may vary. Consider reviewing your plan with a financial advisor."
                        variant="warning"
                    />
                )}
            </div>
        </CalculatorLayout>
    );
}
