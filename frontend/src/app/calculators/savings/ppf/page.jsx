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

export default function PpfCalculatorPage() {
    const [inputs, setInputs] = useState({
        yearlyInvestment: 150000,
        years: 15
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
            const response = await calculatorService.calculatePpf(inputs);

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

    return (
        <CalculatorLayout
            title="PPF Calculator"
            description="Calculate Public Provident Fund maturity amount"
            category="Savings"
        >
            <InputCard
                title="Enter PPF Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Yearly Investment"
                    name="yearlyInvestment"
                    value={inputs.yearlyInvestment}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={500}
                    max={150000}
                    step={5000}
                    tooltip="Max ₹1.5 Lakh/year"
                />

                <FormField
                    label="Investment Period"
                    name="years"
                    value={inputs.years}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={15}
                    max={50}
                    step={5}
                    tooltip="Min 15 years lock-in"
                />

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <strong>Current PPF Rate:</strong> 7.1% p.a. (Compounded Yearly)
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Your PPF Maturity" isEmpty={!result}>
                {result && (
                    <div className="grid grid-cols-2 gap-4">
                        <ResultMetric
                            label="Total Investment"
                            value={formatCurrency(result.totalInvestment)}
                        />
                        <ResultMetric
                            label="Interest Earned"
                            value={formatCurrency(result.totalInterest)}
                            variant="success"
                        />
                        <ResultMetric
                            label="Maturity Amount"
                            value={formatCurrency(result.maturityAmount)}
                            subValue={`After ${inputs.years} years`}
                        />
                        <ResultMetric
                            label="Tax Benefit"
                            value="Section 80C"
                            subValue="EEE Status"
                        />
                    </div>
                )}
            </ResultCard>

            {breakdown.length > 0 && (
                <div className="lg:col-span-2">
                    <BreakdownTable
                        headers={['Year', 'Investment', 'Interest', 'Balance']}
                        rows={breakdown}
                        caption="Year-by-year breakdown of your PPF growth"
                    />
                </div>
            )}
        </CalculatorLayout>
    );
}
