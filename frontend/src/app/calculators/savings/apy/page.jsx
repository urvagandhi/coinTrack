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

export default function ApyCalculatorPage() {
    const [inputs, setInputs] = useState({
        desiredPension: 5000,
        currentAge: 30
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
            const response = await calculatorService.calculateApy(inputs);

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

    const pensionOptions = [1000, 2000, 3000, 4000, 5000];

    return (
        <CalculatorLayout
            title="APY Calculator"
            description="Atal Pension Yojana contribution calculator"
            category="Savings"
        >
            <InputCard
                title="Enter APY Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="space-y-2">
                    <label className="text-sm font-medium">Desired Monthly Pension</label>
                    <div className="grid grid-cols-5 gap-2">
                        {pensionOptions.map(pension => (
                            <button
                                key={pension}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, desiredPension: pension }))}
                                className={`py-2 px-2 text-sm rounded-md border transition-colors
                                    ${inputs.desiredPension === pension
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'}`}
                            >
                                ₹{pension.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                <FormField
                    label="Your Current Age"
                    name="currentAge"
                    value={inputs.currentAge}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={18}
                    max={40}
                    step={1}
                    tooltip="18-40 years eligible"
                />

                <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-blue-800 dark:text-blue-200">
                    <strong>Pension starts at:</strong> 60 years of age
                    <br />
                    <strong>Contribution period:</strong> {60 - inputs.currentAge} years
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="APY Details" isEmpty={!result}>
                    {result && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-primary/10 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Monthly Contribution</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatCurrency(result.monthlyContribution)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Monthly Pension</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(inputs.desiredPension)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ResultMetric
                                    label="Years to Contribute"
                                    value={`${result.contributionYears} years`}
                                />
                                <ResultMetric
                                    label="Total Contribution"
                                    value={formatCurrency(result.totalContribution)}
                                />
                                <ResultMetric
                                    label="Corpus at 60"
                                    value={formatCurrency(result.corpusAmount)}
                                />
                                <ResultMetric
                                    label="Nominee Gets"
                                    value={formatCurrency(result.corpusAmount)}
                                    subValue="On death"
                                />
                            </div>
                        </div>
                    )}
                </ResultCard>

                <DisclaimerBanner
                    title="Government Co-contribution"
                    message="Government contributes 50% of your contribution (max ₹1000/year) for first 5 years if you joined before Dec 2015. Tax benefit under Sec 80CCD(1B) up to ₹50,000."
                    variant="info"
                />
            </div>
        </CalculatorLayout>
    );
}
