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

export default function XirrCalculatorPage() {
    const [cashFlows, setCashFlows] = useState([
        { date: '2020-01-01', amount: -100000 },
        { date: '2021-01-01', amount: -50000 },
        { date: '2022-01-01', amount: -50000 },
        { date: '2024-01-01', amount: 300000 },
    ]);

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const addCashFlow = () => {
        setCashFlows([...cashFlows, { date: '', amount: 0 }]);
    };

    const removeCashFlow = (index) => {
        if (cashFlows.length > 2) {
            setCashFlows(cashFlows.filter((_, i) => i !== index));
        }
    };

    const updateCashFlow = (index, field, value) => {
        const updated = [...cashFlows];
        updated[index] = { ...updated[index], [field]: field === 'amount' ? parseFloat(value) || 0 : value };
        setCashFlows(updated);
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.calculateXirr({
                cashFlows: cashFlows.map(cf => ({
                    date: cf.date,
                    amount: cf.amount
                }))
            });

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
            title="XIRR Calculator"
            description="Calculate Extended Internal Rate of Return for irregular cash flows"
            category="Investment"
        >
            <InputCard
                title="Enter Cash Flows"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="space-y-3">
                    {cashFlows.map((cf, index) => (
                        <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground">Date</label>
                                <input
                                    type="date"
                                    value={cf.date}
                                    onChange={(e) => updateCashFlow(index, 'date', e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground">Amount (-ve for outflow)</label>
                                <input
                                    type="number"
                                    value={cf.amount}
                                    onChange={(e) => updateCashFlow(index, 'amount', e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeCashFlow(index)}
                                className="h-9 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                disabled={cashFlows.length <= 2}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addCashFlow}
                    className="w-full py-2 border border-dashed border-input rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                    + Add Cash Flow
                </button>

                <div className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> Use negative amounts for investments (outflows) and positive for returns (inflows)
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="XIRR Results" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">XIRR (Annualized Return)</p>
                            <p className={`text-3xl font-bold ${result.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(result.xirr)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Total Invested"
                                value={formatCurrency(result.totalInvested)}
                            />
                            <ResultMetric
                                label="Total Received"
                                value={formatCurrency(result.totalReceived)}
                            />
                            <ResultMetric
                                label="Absolute Return"
                                value={formatCurrency(result.absoluteReturn)}
                                variant={result.absoluteReturn >= 0 ? 'success' : 'error'}
                            />
                            <ResultMetric
                                label="Return %"
                                value={formatPercentage((result.absoluteReturn / result.totalInvested) * 100)}
                                variant={result.absoluteReturn >= 0 ? 'success' : 'error'}
                            />
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
