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

export default function SalaryCalculatorPage() {
    const [inputs, setInputs] = useState({
        basicSalary: 50000,
        hra: 20000,
        specialAllowance: 15000,
        lta: 5000,
        otherAllowances: 5000,
        pf: 1800, // Employee contribution
        professionalTax: 200,
        otherDeductions: 0
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
            const response = await calculatorService.calculateSalary(inputs);

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
            title="Salary Calculator"
            description="Calculate net take-home salary from CTC"
            category="Tax"
        >
            <InputCard
                title="Enter Salary Components"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-3">Earnings (Monthly)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="Basic Salary"
                            name="basicSalary"
                            value={inputs.basicSalary}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0}
                            step={1000}
                        />
                        <FormField
                            label="HRA"
                            name="hra"
                            value={inputs.hra}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0}
                            step={500}
                        />
                        <FormField
                            label="Special Allowance"
                            name="specialAllowance"
                            value={inputs.specialAllowance}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0}
                            step={500}
                        />
                        <FormField
                            label="LTA"
                            name="lta"
                            value={inputs.lta}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0}
                            step={500}
                        />
                    </div>
                </div>

                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md">
                    <p className="text-sm font-medium mb-3">Deductions (Monthly)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="PF (Employee)"
                            name="pf"
                            value={inputs.pf}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0}
                            step={100}
                        />
                        <FormField
                            label="Professional Tax"
                            name="professionalTax"
                            value={inputs.professionalTax}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0}
                            max={200}
                            step={50}
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <div className="space-y-4">
                <ResultCard title="Salary Breakdown" isEmpty={!result}>
                    {result && (
                        <div className="space-y-6">
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Net Take-Home (Monthly)</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(result.netMonthlySalary)}
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-muted/50 rounded">
                                    <span>Gross Salary</span>
                                    <span className="font-medium">{formatCurrency(result.grossSalary)}</span>
                                </div>
                                <div className="flex justify-between p-2 text-red-600">
                                    <span>(-) PF Contribution</span>
                                    <span className="font-medium">{formatCurrency(result.pfDeduction)}</span>
                                </div>
                                <div className="flex justify-between p-2 text-red-600">
                                    <span>(-) Professional Tax</span>
                                    <span className="font-medium">{formatCurrency(result.professionalTax)}</span>
                                </div>
                                <div className="flex justify-between p-2 text-red-600">
                                    <span>(-) TDS (Estimated)</span>
                                    <span className="font-medium">{formatCurrency(result.tds)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded font-medium">
                                    <span>Net Salary</span>
                                    <span className="text-green-600">{formatCurrency(result.netMonthlySalary)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ResultMetric
                                    label="Annual CTC"
                                    value={formatCurrency(result.annualCTC)}
                                />
                                <ResultMetric
                                    label="Annual Take-Home"
                                    value={formatCurrency(result.annualNetSalary)}
                                    variant="success"
                                />
                            </div>
                        </div>
                    )}
                </ResultCard>

                <DisclaimerBanner
                    title="Note"
                    message="This is an estimate. Actual salary may vary based on your tax regime, declarations, and employer policies."
                    variant="info"
                />
            </div>
        </CalculatorLayout>
    );
}
