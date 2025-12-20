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

export default function EmiCalculatorPage() {
    const [inputs, setInputs] = useState({
        principal: 5000000,
        annualRate: 8.5,
        months: 240  // 20 years
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
            const response = await calculatorService.calculateEmi(inputs);

            if (response.success) {
                setResult(response.result);

                if (response.breakdown) {
                    setBreakdown(response.breakdown.map(row => [
                        `Year ${row.year}`,
                        formatCurrency(row.investment), // Principal paid
                        formatCurrency(row.interest),   // Interest paid
                        formatCurrency(row.balance)     // Outstanding balance
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
            title="EMI Calculator"
            description="Calculate your Equated Monthly Installment for loans"
            category="Loans"
        >
            {/* Input Section */}
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
                    max={1000000000}
                    step={10000}
                />

                <FormField
                    label="Interest Rate (Annual)"
                    name="annualRate"
                    value={inputs.annualRate}
                    onChange={handleInputChange}
                    suffix="%"
                    min={1}
                    max={50}
                    step={0.1}
                />

                <FormField
                    label="Loan Tenure"
                    name="months"
                    value={inputs.months}
                    onChange={handleInputChange}
                    suffix="Months"
                    min={1}
                    max={600}
                    step={12}
                    tooltip={`${years} years ${remainingMonths > 0 ? remainingMonths + ' months' : ''}`}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            {/* Results Section */}
            <ResultCard title="Your EMI Details" isEmpty={!result}>
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
                                label="Principal Amount"
                                value={formatCurrency(result.principal)}
                            />
                            <ResultMetric
                                label="Total Interest"
                                value={formatCurrency(result.totalInterest)}
                                variant="warning"
                            />
                            <ResultMetric
                                label="Total Amount"
                                value={formatCurrency(result.totalPayment)}
                                subValue={`Over ${years} years`}
                            />
                            <ResultMetric
                                label="Interest %"
                                value={formatPercentage((result.totalInterest / result.principal) * 100)}
                            />
                        </div>
                    </div>
                )}
            </ResultCard>

            {/* Breakdown Table */}
            {breakdown.length > 0 && (
                <div className="lg:col-span-2">
                    <BreakdownTable
                        headers={['Year', 'Principal Paid', 'Interest Paid', 'Outstanding']}
                        rows={breakdown}
                        caption="Year-by-year breakdown of your loan repayment"
                    />
                </div>
            )}
        </CalculatorLayout>
    );
}
