'use client';

import {
    CalculatorLayout,
    DisclaimerBanner,
    FormField,
    InputCard,
    ResultCard
} from '@/components/calculators/framework/CalculatorComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculatorService, formatCurrency } from '@/lib/calculator.service';
import { useState } from 'react';

export default function IncomeTaxCalculatorPage() {
    const [inputs, setInputs] = useState({
        grossIncome: 1200000,
        section80CDeductions: 150000,
        section80DDeductions: 25000,
        otherDeductions: 0,
        hraExemption: 0,
        financialYear: '2024-25'
    });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: name === 'financialYear' ? value : (parseFloat(value) || 0)
        }));
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.calculateIncomeTax(inputs);

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
            title="Income Tax Calculator"
            description="Compare your tax liability under Old and New Regime (India FY 2024-25)"
            category="Tax"
        >
            {/* Input Section */}
            <InputCard
                title="Enter Income Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Gross Annual Income"
                    name="grossIncome"
                    value={inputs.grossIncome}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={10000}
                />

                <FormField
                    label="Section 80C Deductions"
                    name="section80CDeductions"
                    value={inputs.section80CDeductions}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    max={150000}
                    step={5000}
                    tooltip="Max ₹1.5 Lakh (LIC, PPF, ELSS)"
                />

                <FormField
                    label="Section 80D Deductions"
                    name="section80DDeductions"
                    value={inputs.section80DDeductions}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    max={75000}
                    step={5000}
                    tooltip="Health Insurance (Max ₹25K-75K)"
                />

                <FormField
                    label="Other Deductions"
                    name="otherDeductions"
                    value={inputs.otherDeductions}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0}
                    step={5000}
                    tooltip="80E, 80G, etc."
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            {/* Results Section */}
            <div className="space-y-4">
                <ResultCard title="Tax Comparison" isEmpty={!result}>
                    {result && (
                        <div className="space-y-4">
                            {/* Recommendation */}
                            <div className={`p-4 rounded-lg text-center ${result.recommendedRegime === 'NEW_REGIME'
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : result.recommendedRegime === 'OLD_REGIME'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                        : 'bg-gray-50 dark:bg-gray-900/20'
                                }`}>
                                <p className="text-sm font-medium">Recommended</p>
                                <p className="text-lg font-bold">
                                    {result.recommendedRegime === 'NEW_REGIME' ? 'New Regime'
                                        : result.recommendedRegime === 'OLD_REGIME' ? 'Old Regime'
                                            : 'Either Regime'}
                                </p>
                                {result.taxSavings > 0 && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        Save {formatCurrency(result.taxSavings)}
                                    </p>
                                )}
                            </div>

                            {/* Side by side comparison */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Old Regime */}
                                <Card className={result.recommendedRegime === 'OLD_REGIME' ? 'border-blue-500' : ''}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Old Regime</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Taxable Income</p>
                                            <p className="font-medium">{formatCurrency(result.taxableIncomeOldRegime)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tax</p>
                                            <p className="font-medium">{formatCurrency(result.taxOldRegime)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Cess (4%)</p>
                                            <p className="font-medium">{formatCurrency(result.cessOldRegime)}</p>
                                        </div>
                                        <hr />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Tax</p>
                                            <p className="text-lg font-bold">{formatCurrency(result.totalTaxOldRegime)}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* New Regime */}
                                <Card className={result.recommendedRegime === 'NEW_REGIME' ? 'border-green-500' : ''}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">New Regime</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Taxable Income</p>
                                            <p className="font-medium">{formatCurrency(result.taxableIncomeNewRegime)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tax</p>
                                            <p className="font-medium">{formatCurrency(result.taxNewRegime)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Cess (4%)</p>
                                            <p className="font-medium">{formatCurrency(result.cessNewRegime)}</p>
                                        </div>
                                        <hr />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Tax</p>
                                            <p className="text-lg font-bold">{formatCurrency(result.totalTaxNewRegime)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </ResultCard>

                {/* Disclaimer */}
                {result && (
                    <DisclaimerBanner
                        title="Important Disclaimer"
                        message={result.disclaimer}
                        variant="warning"
                    />
                )}
            </div>
        </CalculatorLayout>
    );
}
