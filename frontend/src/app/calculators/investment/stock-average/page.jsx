'use client';

import {
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { calculatorService, formatCurrency, formatNumber } from '@/lib/calculator.service';
import { useState } from 'react';

export default function StockAverageCalculatorPage() {
    const [inputs, setInputs] = useState({
        existingQuantity: 100,
        existingPrice: 150,
        newQuantity: 50,
        newPrice: 120
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
            const response = await calculatorService.calculateStockAverage(inputs);

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

    const existingValue = inputs.existingQuantity * inputs.existingPrice;
    const newValue = inputs.newQuantity * inputs.newPrice;

    return (
        <CalculatorLayout
            title="Stock Average Calculator"
            description="Calculate weighted average price after buying more shares"
            category="Investment"
        >
            <InputCard
                title="Enter Stock Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-2">Existing Holdings</p>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="Quantity"
                            name="existingQuantity"
                            value={inputs.existingQuantity}
                            onChange={handleInputChange}
                            min={0}
                            step={1}
                        />
                        <FormField
                            label="Buy Price"
                            name="existingPrice"
                            value={inputs.existingPrice}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0.01}
                            step={0.1}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Value: {formatCurrency(existingValue)}
                    </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm font-medium mb-2">New Purchase</p>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="Quantity"
                            name="newQuantity"
                            value={inputs.newQuantity}
                            onChange={handleInputChange}
                            min={1}
                            step={1}
                        />
                        <FormField
                            label="Buy Price"
                            name="newPrice"
                            value={inputs.newPrice}
                            onChange={handleInputChange}
                            prefix="₹"
                            min={0.01}
                            step={0.1}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Value: {formatCurrency(newValue)}
                    </p>
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Average Price" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">New Average Price</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.averagePrice)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Total Quantity"
                                value={formatNumber(result.totalQuantity)}
                                subValue="shares"
                            />
                            <ResultMetric
                                label="Total Investment"
                                value={formatCurrency(result.totalInvestment)}
                            />
                            <ResultMetric
                                label="Previous Avg"
                                value={formatCurrency(inputs.existingPrice)}
                            />
                            <ResultMetric
                                label="Change"
                                value={formatCurrency(result.averagePrice - inputs.existingPrice)}
                                variant={result.averagePrice < inputs.existingPrice ? 'success' : 'warning'}
                            />
                        </div>

                        {result.averagePrice < inputs.existingPrice && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-700 dark:text-green-300">
                                ✓ Your average cost has decreased by {formatCurrency(inputs.existingPrice - result.averagePrice)} per share
                            </div>
                        )}
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
