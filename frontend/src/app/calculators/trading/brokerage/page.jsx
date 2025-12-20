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

export default function BrokerageCalculatorPage() {
    const [inputs, setInputs] = useState({
        transactionType: 'DELIVERY',
        buyPrice: 100,
        sellPrice: 110,
        quantity: 100
    });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: name === 'transactionType' ? value : (parseFloat(value) || 0)
        }));
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await calculatorService.calculateBrokerage(inputs);

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

    const transactionTypes = [
        { id: 'DELIVERY', name: 'Delivery' },
        { id: 'INTRADAY', name: 'Intraday' },
        { id: 'FUTURES', name: 'F&O Futures' },
        { id: 'OPTIONS', name: 'F&O Options' },
    ];

    return (
        <CalculatorLayout
            title="Brokerage Calculator"
            description="Calculate brokerage and all trading charges"
            category="Trading"
        >
            <InputCard
                title="Enter Trade Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <div className="space-y-2">
                    <label className="text-sm font-medium">Transaction Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        {transactionTypes.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, transactionType: type.id }))}
                                className={`py-2 px-3 text-sm rounded-md border transition-colors
                                    ${inputs.transactionType === type.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'}`}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                </div>

                <FormField
                    label="Buy Price"
                    name="buyPrice"
                    value={inputs.buyPrice}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0.01}
                    step={0.1}
                />

                <FormField
                    label="Sell Price"
                    name="sellPrice"
                    value={inputs.sellPrice}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={0.01}
                    step={0.1}
                />

                <FormField
                    label="Quantity"
                    name="quantity"
                    value={inputs.quantity}
                    onChange={handleInputChange}
                    min={1}
                    step={1}
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </InputCard>

            <ResultCard title="Charges Breakdown" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xs text-muted-foreground">Gross P&L</p>
                                <p className={`text-xl font-bold ${result.grossPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(result.grossPnl)}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-primary/10 rounded-lg">
                                <p className="text-xs text-muted-foreground">Net P&L</p>
                                <p className={`text-xl font-bold ${result.netPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(result.netPnl)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                                <span>Turnover</span>
                                <span className="font-medium">{formatCurrency(result.turnover)}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                                <span>Brokerage</span>
                                <span className="font-medium">{formatCurrency(result.brokerage)}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                                <span>STT</span>
                                <span className="font-medium">{formatCurrency(result.stt)}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                                <span>Exchange Charges</span>
                                <span className="font-medium">{formatCurrency(result.exchangeCharges)}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                                <span>GST (18%)</span>
                                <span className="font-medium">{formatCurrency(result.gst)}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                                <span>SEBI Charges</span>
                                <span className="font-medium">{formatCurrency(result.sebiCharges)}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                                <span>Stamp Duty</span>
                                <span className="font-medium">{formatCurrency(result.stampDuty)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-muted rounded font-medium">
                                <span>Total Charges</span>
                                <span className="text-red-500">{formatCurrency(result.totalCharges)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <ResultMetric
                                label="Breakeven"
                                value={formatCurrency(result.breakeven)}
                                subValue="Points to cover charges"
                            />
                            <ResultMetric
                                label="Charges %"
                                value={formatPercentage((result.totalCharges / result.turnover) * 100)}
                                subValue="of turnover"
                            />
                        </div>
                    </div>
                )}
            </ResultCard>
        </CalculatorLayout>
    );
}
