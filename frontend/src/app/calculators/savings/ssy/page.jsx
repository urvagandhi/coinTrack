'use client';

import {
    BreakdownTable,
    CalculatorLayout,
    DisclaimerBanner,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency } from '@/lib/calculator.service';
import { useState } from 'react';

export default function SsyCalculatorPage() {
    const [inputs, setInputs] = useState({
        yearlyInvestment: 50000,
        girlAge: 5
    });

    const [result, setResult] = useState(null);
    const [breakdown, setBreakdown] = useState([]);
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
            const response = await calculatorService.calculateSsy(inputs);

            if (response.success) {
                setResult(response.result);

                if (response.breakdown) {
                    setBreakdown(response.breakdown.map(row => [
                        `Year ${row.year}`,
                        `Age ${row.girlAge}`,
                        formatCurrency(row.investment),
                        formatCurrency(row.interest),
                        formatCurrency(row.balance)
                    ]));
                }
            } else {
                setError(response.error?.message || 'Calculation failed');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to calculate. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const maturityAge = 21;
    const depositYears = 15;

    return (
        <CalculatorLayout
            title="SSY Calculator"
            description="Calculate Sukanya Samriddhi Yojana maturity amount"
            category="Savings"
        >
            <InputCard
                title="Enter SSY Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Yearly Investment"
                    name="yearlyInvestment"
                    value={inputs.yearlyInvestment}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={250}
                    max={150000}
                    step={5000}
                    tooltip="Min ₹250, Max ₹1.5 Lakh/year"
                />

                <FormField
                    label="Girl's Current Age"
                    name="girlAge"
                    value={inputs.girlAge}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={0}
                    max={10}
                    step={1}
                    tooltip="Account can be opened for girl child below 10 years"
                />

                <div className="space-y-2 text-sm bg-pink-50 dark:bg-pink-900/20 p-3 rounded-md text-pink-800 dark:text-pink-200">
                    <div className="flex justify-between">
                        <span>Current Interest Rate:</span>
                        <span className="font-medium">8.2% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Deposit Period:</span>
                        <span className="font-medium">15 years</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Maturity:</span>
                        <span className="font-medium">21 years from opening</span>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="SSY Maturity Amount" isEmpty={!result}>
                    {result && (
                        <div className="space-y-6">
                            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Maturity Amount</p>
                                <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                                    {formatCurrency(result.maturityAmount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    When girl turns {maturityAge} years old
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ResultMetric
                                    label="Total Investment"
                                    value={formatCurrency(result.totalInvestment)}
                                    subValue={`Over ${depositYears} years`}
                                />
                                <ResultMetric
                                    label="Total Interest"
                                    value={formatCurrency(result.totalInterest)}
                                    variant="success"
                                />
                                <ResultMetric
                                    label="Girl's Age at Maturity"
                                    value={`${maturityAge} years`}
                                />
                                <ResultMetric
                                    label="Tax Status"
                                    value="EEE"
                                    subValue="Fully Tax-Free"
                                />
                            </div>
                        </div>
                    )}
                </ResultCard>

                {result && (
                    <DisclaimerBanner
                        title="Partial Withdrawal"
                        message="50% of the balance can be withdrawn after the girl turns 18 for higher education or marriage purposes."
                        variant="info"
                    />
                )}
            </div>

            {breakdown.length > 0 && (
                <div className="lg:col-span-2">
                    <BreakdownTable
                        headers={['Year', 'Age', 'Investment', 'Interest', 'Balance']}
                        rows={breakdown}
                        caption="Year-by-year breakdown of SSY account growth"
                    />
                </div>
            )}
        </CalculatorLayout>
    );
}
