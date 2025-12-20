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

export default function StepUpSipCalculatorPage() {
    const [inputs, setInputs] = useState({
        monthlyInvestment: 5000,
        expectedReturn: 12,
        years: 10,
        stepUpPercent: 10
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
            const response = await calculatorService.calculateStepUpSip(inputs);

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
            title="Step-Up SIP Calculator"
            description="Calculate returns with yearly SIP increment"
            category="Investment"
        >
            <InputCard
                title="Enter Step-Up SIP Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Initial Monthly Investment"
                    name="monthlyInvestment"
                    value={inputs.monthlyInvestment}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={500}
                    max={10000000}
                    step={500}
                    tooltip="Starting SIP amount"
                />

                <FormField
                    label="Annual Step-Up"
                    name="stepUpPercent"
                    value={inputs.stepUpPercent}
                    onChange={handleInputChange}
                    suffix="%"
                    min={0}
                    max={50}
                    step={1}
                    tooltip="Yearly SIP increment"
                />

                <FormField
                    label="Expected Annual Return"
                    name="expectedReturn"
                    value={inputs.expectedReturn}
                    onChange={handleInputChange}
                    suffix="%"
                    min={1}
                    max={50}
                    step={0.5}
                />

                <FormField
                    label="Investment Period"
                    name="years"
                    value={inputs.years}
                    onChange={handleInputChange}
                    suffix="Years"
                    min={1}
                    max={50}
                    step={1}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Your Step-Up SIP Returns" isEmpty={!result}>
                {result && (
                    <div className="grid grid-cols-2 gap-4">
                        <ResultMetric
                            label="Total Investment"
                            value={formatCurrency(result.totalInvestment)}
                        />
                        <ResultMetric
                            label="Estimated Returns"
                            value={formatCurrency(result.totalGains)}
                            variant="success"
                        />
                        <ResultMetric
                            label="Total Value"
                            value={formatCurrency(result.futureValue)}
                            subValue={`After ${inputs.years} years`}
                        />
                        <ResultMetric
                            label="CAGR"
                            value={formatPercentage(result.cagr)}
                            variant="success"
                        />
                    </div>
                )}
            </ResultCard>

            {breakdown.length > 0 && (
                <div className="lg:col-span-2">
                    <BreakdownTable
                        headers={['Year', 'Investment', 'Interest', 'Balance']}
                        rows={breakdown}
                        caption="Year-by-year breakdown of your Step-Up SIP growth"
                    />
                </div>
            )}
        </CalculatorLayout>
    );
}
