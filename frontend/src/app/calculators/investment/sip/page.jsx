'use client';

import {
    BreakdownTable,
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculatorService, formatCurrency, formatPercentage } from '@/lib/calculator.service';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e'];

export default function SipCalculatorPage() {
    const [inputs, setInputs] = useState({
        monthlyInvestment: 5000,
        expectedReturn: 12,
        years: 10
    });

    const [result, setResult] = useState(null);
    const [breakdown, setBreakdown] = useState([]);
    const [chartData, setChartData] = useState([]);
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
            const response = await calculatorService.calculateSip(inputs);

            if (response.success) {
                setResult(response.result);

                // Format breakdown for table and chart
                if (response.breakdown) {
                    setBreakdown(response.breakdown.map(row => [
                        `Year ${row.year}`,
                        formatCurrency(row.investment),
                        formatCurrency(row.interest),
                        formatCurrency(row.balance)
                    ]));

                    // Format data for area chart
                    setChartData(response.breakdown.map(row => ({
                        year: `Y${row.year}`,
                        investment: row.investment,
                        returns: row.interest,
                        total: row.balance
                    })));
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

    // Pie chart data
    const pieData = result ? [
        { name: 'Investment', value: result.totalInvestment },
        { name: 'Returns', value: result.totalGains }
    ] : [];

    return (
        <CalculatorLayout
            title="SIP Calculator"
            description="Calculate the future value of your Systematic Investment Plan"
            category="Investment"
        >
            {/* Input Section */}
            <InputCard
                title="Enter Your SIP Details"
                onCalculate={handleCalculate}
                isLoading={isLoading}
            >
                <FormField
                    label="Monthly Investment"
                    name="monthlyInvestment"
                    value={inputs.monthlyInvestment}
                    onChange={handleInputChange}
                    prefix="₹"
                    min={500}
                    max={10000000}
                    step={500}
                    tooltip="Min ₹500"
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
                    tooltip="1-50%"
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

            {/* Results Section */}
            <ResultCard title="Your SIP Returns" isEmpty={!result}>
                {result && (
                    <div className="space-y-6">
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

                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </ResultCard>

            {/* Growth Chart */}
            {chartData.length > 0 && (
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Investment Growth Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="year" className="text-xs" />
                                        <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} className="text-xs" />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="investment"
                                            stackId="1"
                                            name="Investment"
                                            stroke="#3b82f6"
                                            fill="url(#colorInv)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="returns"
                                            stackId="1"
                                            name="Returns"
                                            stroke="#22c55e"
                                            fill="url(#colorRet)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Breakdown Table */}
            {breakdown.length > 0 && (
                <div className="lg:col-span-2">
                    <BreakdownTable
                        headers={['Year', 'Investment', 'Interest', 'Balance']}
                        rows={breakdown}
                        caption="Year-by-year breakdown of your SIP growth"
                    />
                </div>
            )}
        </CalculatorLayout>
    );
}

