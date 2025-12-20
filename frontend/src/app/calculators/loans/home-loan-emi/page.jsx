'use client';

import {
    BreakdownTable,
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency, formatPercentage } from '@/lib/calculator.service';
import { useState } from 'react';

export default function HomeLoanEmiCalculatorPage() {
    const [inputs, setInputs] = useState({
        principal: 5000000,
        annualRate: 8.5,
        months: 240
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
            const response = await calculatorService.calculateHomeLoanEmi(inputs);

            if (response.success) {
                setResult(response.result);

                if (response.breakdown) {
                    setBreakdown(response.breakdown.map(row => [
                        `Year ${row.year}`,
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

    const years = Math.floor(inputs.months / 12);
    const remainingMonths = inputs.months % 12;

    return (
        <CalculatorLayout
            title="Home Loan EMI Calculator"
            description="Calculate your home loan EMI and total interest"
            category="Loans"
        >
            <InputCard
                title="Enter Home Loan Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Loan Amount"
                    name="principal"
                    value={inputs.principal}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={100000}
                    max={100000000}
                    step={100000}
                />

                <FormField
                    label="Interest Rate"
                    name="annualRate"
                    value={inputs.annualRate}
                    onChange={handleInputChange}
                    suffix="%"
                    min={5}
                    max={20}
                    step={0.1}
                    tooltip="Current rates: 8-10%"
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
                    tooltip={`${years} years ${remainingMonths > 0 ? remainingMonths + ' months' : ''}`}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Home Loan EMI Details" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Monthly EMI</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.emi)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Principal"
                                value={formatCurrency(result.principal)}
                            />
                            <ResultMetric
                                label="Total Interest"
                                value={formatCurrency(result.totalInterest)}
                                variant="warning"
                            />
                            <ResultMetric
                                label="Total Payment"
                                value={formatCurrency(result.totalPayment)}
                                subValue={`Over ${years} years`}
                            />
                            <ResultMetric
                                label="Interest/Principal"
                                value={formatPercentage((result.totalInterest / result.principal) * 100)}
                            />
                        </div>
                    </div>
                )}
            </ResultCard>

            {breakdown.length > 0 && (
                <div className="lg:col-span-2">
                    <BreakdownTable
                        headers={['Year', 'Principal Paid', 'Interest Paid', 'Outstanding']}
                        rows={breakdown}
                        caption="Year-by-year breakdown of your home loan repayment"
                    />
                </div>
            )}
        </CalculatorLayout>
    );
}
