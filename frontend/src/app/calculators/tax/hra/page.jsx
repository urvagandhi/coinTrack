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

export default function HraCalculatorPage() {
    const [inputs, setInputs] = useState({
        basicSalary: 50000,
        dearnessAllowance: 0,
        hraReceived: 20000,
        rentPaid: 25000,
        isMetroCity: true
    });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (parseFloat(value) || 0)
        }));
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.calculateHra(inputs);

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
            title="HRA Calculator"
            description="Calculate your House Rent Allowance exemption"
            category="Tax"
        >
            <InputCard
                title="Enter Salary Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Monthly Basic Salary"
                    name="basicSalary"
                    value={inputs.basicSalary}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1000}
                    step={5000}
                />

                <FormField
                    label="Dearness Allowance"
                    name="dearnessAllowance"
                    value={inputs.dearnessAllowance}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={1000}
                />

                <FormField
                    label="HRA Received"
                    name="hraReceived"
                    value={inputs.hraReceived}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={1000}
                />

                <FormField
                    label="Monthly Rent Paid"
                    name="rentPaid"
                    value={inputs.rentPaid}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={1000}
                />

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isMetroCity"
                        name="isMetroCity"
                        checked={inputs.isMetroCity}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isMetroCity" className="text-sm font-medium">
                        Live in Metro City (Delhi/Mumbai/Kolkata/Chennai)
                    </label>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="HRA Exemption" isEmpty={!result}>
                    {result && (
                        <div className="space-y-6">
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">HRA Exemption</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(result.hraExemption)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">per month</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-muted/50 rounded">
                                    <span>Actual HRA Received</span>
                                    <span className="font-medium">{formatCurrency(result.actualHra)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded">
                                    <span>{inputs.isMetroCity ? '50%' : '40%'} of Basic+DA</span>
                                    <span className="font-medium">{formatCurrency(result.percentOfBasic)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded">
                                    <span>Rent - 10% of Basic+DA</span>
                                    <span className="font-medium">{formatCurrency(result.rentMinus10Percent)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ResultMetric
                                    label="Taxable HRA"
                                    value={formatCurrency(result.taxableHra)}
                                    variant="warning"
                                />
                                <ResultMetric
                                    label="Yearly Exemption"
                                    value={formatCurrency(result.hraExemption * 12)}
                                    variant="success"
                                />
                            </div>
                        </div>
                    )}
                </ResultCard>

                {result && (
                    <DisclaimerBanner
                        title="How HRA Exemption Works"
                        message="HRA exemption is the minimum of: (1) Actual HRA received, (2) 50% of salary for metro cities or 40% for non-metro, (3) Rent paid minus 10% of salary."
                        variant="info"
                    />
                )}
            </div>
        </CalculatorLayout>
    );
}
