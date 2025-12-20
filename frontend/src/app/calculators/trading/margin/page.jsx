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

export default function MarginCalculatorPage() {
    const [inputs, setInputs] = useState({
        segmentType: 'EQUITY_INTRADAY',
        tradeValue: 100000,
        stockSymbol: 'RELIANCE'
    });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: name === 'tradeValue' ? (parseFloat(value) || 0) : value
        }));
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.calculateMargin(inputs);

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

    const segments = [
        { id: 'EQUITY_DELIVERY', name: 'Equity Delivery' },
        { id: 'EQUITY_INTRADAY', name: 'Equity Intraday' },
        { id: 'FUTURES', name: 'Futures' },
        { id: 'OPTIONS_BUY', name: 'Options Buy' },
        { id: 'OPTIONS_SELL', name: 'Options Sell' },
        { id: 'COMMODITY', name: 'Commodity' },
        { id: 'CURRENCY', name: 'Currency' },
    ];

    return (
        <CalculatorLayout
            title="Margin Calculator"
            description="Calculate margin requirements for trading"
            category="Trading"
        >
            <InputCard
                title="Enter Trade Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="space-y-2">
                    <label className="text-sm font-medium">Segment</label>
                    <div className="grid grid-cols-2 gap-2">
                        {segments.slice(0, 4).map(seg => (
                            <button
                                key={seg.id}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, segmentType: seg.id }))}
                                className={`py-2 px-3 text-sm rounded-md border transition-colors
                                    ${inputs.segmentType === seg.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'}`}
                            >
                                {seg.name}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {segments.slice(4).map(seg => (
                            <button
                                key={seg.id}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, segmentType: seg.id }))}
                                className={`py-2 px-3 text-xs rounded-md border transition-colors
                                    ${inputs.segmentType === seg.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'}`}
                            >
                                {seg.name}
                            </button>
                        ))}
                    </div>
                </div>

                <FormField
                    label="Trade Value"
                    name="tradeValue"
                    value={inputs.tradeValue}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={1000}
                    step={10000}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Margin Requirements" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Required Margin</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(result.requiredMargin)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Trade Value"
                                value={formatCurrency(result.tradeValue)}
                            />
                            <ResultMetric
                                label="Margin %"
                                value={formatPercentage(result.marginPercent)}
                            />
                            <ResultMetric
                                label="Leverage"
                                value={`${result.leverage}x`}
                                subValue="Max leverage"
                            />
                            <ResultMetric
                                label="Exposure"
                                value={formatCurrency(result.exposure)}
                                subValue="You can trade"
                            />
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span>SPAN Margin</span>
                                <span className="font-medium">{formatCurrency(result.spanMargin)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span>Exposure Margin</span>
                                <span className="font-medium">{formatCurrency(result.exposureMargin)}</span>
                            </div>
                            {result.premiumMargin > 0 && (
                                <div className="flex justify-between p-2 bg-muted/50 rounded">
                                    <span>Premium Margin</span>
                                    <span className="font-medium">{formatCurrency(result.premiumMargin)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
