'use client';

import {
    BreakdownTable,
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency } from '@/lib/calculator.service';
import { useState } from 'react';

export default function EpfCalculatorPage() {
    const [inputs, setInputs] = useState({
        monthlyBasicSalary: 30000,
        currentAge: 25,
        retirementAge: 58,
        currentEpfBalance: 100000,
        expectedSalaryGrowth: 5
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
            const response = await calculatorService.calculateEpf(inputs);

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

    const yearsToRetirement = inputs.retirementAge - inputs.currentAge;

    return (
        <CalculatorLayout
            title="EPF Calculator"
            description="Calculate your Employee Provident Fund maturity amount"
            category="Savings"
        >
            <InputCard
                title="Enter EPF Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Monthly Basic Salary"
                    name="monthlyBasicSalary"
                    value={inputs.monthlyBasicSalary}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={5000}
                    step={5000}
                    tooltip="Basic + DA"
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Current Age"
                        name="currentAge"
                        value={inputs.currentAge}
                        onChange={handleInputChange}
                        suffix="Years"
                        min={18}
                        max={55}
                        step={1}
                    />

                    <FormField
                        label="Retirement Age"
                        name="retirementAge"
                        value={inputs.retirementAge}
                        onChange={handleInputChange}
                        suffix="Years"
                        min={50}
                        max={60}
                        step={1}
                    />
                </div>

                <FormField
                    label="Current EPF Balance"
                    name="currentEpfBalance"
                    value={inputs.currentEpfBalance}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={10000}
                />

                <FormField
                    label="Expected Salary Growth"
                    name="expectedSalaryGrowth"
                    value={inputs.expectedSalaryGrowth}
                    onChange={handleInputChange}
                    suffix="%"
                    min={0}
                    max={20}
                    step={1}
                />

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <strong>Current EPF Interest Rate:</strong> 8.25% p.a.
                    <br />
                    <span className="text-xs">Employee: 12% | Employer: 12% (3.67% to EPF, 8.33% to EPS)</span>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Your EPF Maturity" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">EPF Maturity Amount</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.maturityAmount)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Total Contribution"
                                value={formatCurrency(result.totalContribution)}
                            />
                            <ResultMetric
                                label="Total Interest"
                                value={formatCurrency(result.totalInterest)}
                                variant="success"
                            />
                            <ResultMetric
                                label="Years to Retirement"
                                value={`${yearsToRetirement} years`}
                            />
                            <ResultMetric
                                label="Monthly Contribution"
                                value={formatCurrency(result.monthlyContribution)}
                                subValue="Employee + Employer"
                            />
                        </div>
                    </div>
                )}
            </ResultCard>

            {breakdown.length > 0 && (
                <div className="lg:col-span-2">
                    <BreakdownTable
                        headers={['Year', 'Contribution', 'Interest', 'Balance']}
                        rows={breakdown}
                        caption="Year-by-year breakdown of your EPF growth"
                    />
                </div>
            )}
        </CalculatorLayout>
    );
}
