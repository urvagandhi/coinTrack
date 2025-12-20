'use client';

import {
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency, formatPercentage } from '@/lib/calculator.service';
import { useState } from 'react';

export default function TdsCalculatorPage() {
    const [inputs, setInputs] = useState({
        paymentType: 'SALARY',
        amount: 50000,
        panAvailable: true
    });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'paymentType' ? value : (parseFloat(value) || 0))
        }));
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.calculateTds(inputs);

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

    const paymentTypes = [
        { id: 'SALARY', name: 'Salary (192)' },
        { id: 'INTEREST', name: 'Interest (194A)' },
        { id: 'DIVIDEND', name: 'Dividend (194)' },
        { id: 'CONTRACTOR', name: 'Contractor (194C)' },
        { id: 'PROFESSIONAL', name: 'Professional (194J)' },
        { id: 'RENT', name: 'Rent (194I)' },
        { id: 'COMMISSION', name: 'Commission (194H)' },
        { id: 'PROPERTY_SALE', name: 'Property (194IA)' },
    ];

    return (
        <CalculatorLayout
            title="TDS Calculator"
            description="Calculate TDS deduction on various payments"
            category="Tax"
        >
            <InputCard
                title="Enter Payment Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Type (Section)</label>
                    <select
                        name="paymentType"
                        value={inputs.paymentType}
                        onChange={handleInputChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {paymentTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                </div>

                <FormField
                    label="Payment Amount"
                    name="amount"
                    value={inputs.amount}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1}
                    step={1000}
                />

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="panAvailable"
                        name="panAvailable"
                        checked={inputs.panAvailable}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="panAvailable" className="text-sm font-medium">
                        PAN of Deductee Available
                    </label>
                </div>

                {!inputs.panAvailable && (
                    <div className="text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-md">
                        ⚠️ Without PAN, TDS is deducted at 20% or applicable rate, whichever is higher (Sec 206AA)
                    </div>
                )}

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="TDS Calculation" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-xs text-muted-foreground">TDS Deducted</p>
                                <p className="text-xl font-bold text-red-600">
                                    {formatCurrency(result.tdsAmount)}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xs text-muted-foreground">Net Payment</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(result.netPayment)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Gross Amount"
                                value={formatCurrency(result.grossAmount)}
                            />
                            <ResultMetric
                                label="TDS Rate"
                                value={formatPercentage(result.tdsRate)}
                            />
                            <ResultMetric
                                label="Section"
                                value={result.section}
                            />
                            <ResultMetric
                                label="Threshold"
                                value={formatCurrency(result.threshold)}
                                subValue="Annual limit"
                            />
                        </div>

                        {result.tdsAmount === 0 && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-700 dark:text-blue-300">
                                No TDS applicable - amount is below the threshold limit of {formatCurrency(result.threshold)}
                            </div>
                        )}
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
