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

export default function GstCalculatorPage() {
    const [inputs, setInputs] = useState({
        amount: 10000,
        gstRate: 18,
        isInclusive: false
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
            const response = await calculatorService.calculateGst(inputs);

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
            title="GST Calculator"
            description="Calculate GST inclusive and exclusive amounts"
            category="Tax"
        >
            <InputCard
                title="Enter Amount Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Amount"
                    name="amount"
                    value={inputs.amount}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1}
                    step={100}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium">GST Rate</label>
                    <div className="grid grid-cols-5 gap-2">
                        {[0, 5, 12, 18, 28].map(rate => (
                            <button
                                key={rate}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, gstRate: rate }))}
                                className={`py-2 px-3 text-sm rounded-md border transition-colors
                                    ${inputs.gstRate === rate
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'}`}
                            >
                                {rate}%
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isInclusive"
                        name="isInclusive"
                        checked={inputs.isInclusive}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isInclusive" className="text-sm font-medium">
                        Amount is GST Inclusive
                    </label>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="GST Breakdown" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">
                                {inputs.isInclusive ? 'GST Exclusive Amount' : 'GST Inclusive Amount'}
                            </p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(inputs.isInclusive ? result.baseAmount : result.totalAmount)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Base Amount"
                                value={formatCurrency(result.baseAmount)}
                            />
                            <ResultMetric
                                label="GST Amount"
                                value={formatCurrency(result.gstAmount)}
                                variant="warning"
                            />
                            <ResultMetric
                                label="CGST"
                                value={formatCurrency(result.cgst)}
                                subValue={formatPercentage(inputs.gstRate / 2)}
                            />
                            <ResultMetric
                                label="SGST"
                                value={formatCurrency(result.sgst)}
                                subValue={formatPercentage(inputs.gstRate / 2)}
                            />
                        </div>

                        <div className="p-3 bg-muted/50 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Total Amount</span>
                                <span className="text-xl font-bold">{formatCurrency(result.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
