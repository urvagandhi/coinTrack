'use client';

import {
    BreakdownTable,
    CalculatorLayout,
    FormField,
    InputCard,
    ResultCard,
    ResultMetric
} from '@/components/calculators/framework/CalculatorComponents';
import { AlertCircle } from 'lucide-react';
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

// Editorial chart palette: invested = foreground, returns = gain
const INVESTED_COLOR = 'hsl(var(--foreground))';
const RETURNS_COLOR = 'hsl(var(--gain))';
const COLORS = [INVESTED_COLOR, RETURNS_COLOR];

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
                    <div className="border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.05)] px-3 py-2.5 flex items-start gap-2">
                        <AlertCircle size={13} className="text-[hsl(var(--loss))] flex-shrink-0 mt-0.5" />
                        <p className="font-mono text-[12px] text-[hsl(var(--loss))] leading-snug">{error}</p>
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
                                        innerRadius={62}
                                        outerRadius={92}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="hsl(var(--background))"
                                        strokeWidth={2}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{
                                            background: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 0,
                                            fontSize: 12,
                                            fontFamily: 'var(--font-mono)',
                                        }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10 }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="square"
                                        wrapperStyle={{
                                            fontSize: 11,
                                            fontFamily: 'var(--font-mono)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.18em',
                                            color: 'hsl(var(--muted-foreground))',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </ResultCard>

            {/* Growth Chart */}
            {chartData.length > 0 && (
                <section className="lg:col-span-2 bg-background border border-hairline">
                    <div className="border-b border-hairline px-5 py-3.5 flex items-baseline gap-3">
                        <span className="display-num text-[10px] text-[hsl(var(--accent))]">§C</span>
                        <h3 className="eyebrow-strong">Investment Growth Over Time</h3>
                    </div>
                    <div className="px-5 py-5">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={INVESTED_COLOR} stopOpacity={0.45} />
                                            <stop offset="95%" stopColor={INVESTED_COLOR} stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={RETURNS_COLOR} stopOpacity={0.45} />
                                            <stop offset="95%" stopColor={RETURNS_COLOR} stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="year"
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                                        axisLine={{ stroke: 'hsl(var(--border))' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                                        axisLine={{ stroke: 'hsl(var(--border))' }}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{
                                            background: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 0,
                                            fontSize: 12,
                                            fontFamily: 'var(--font-mono)',
                                        }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 10 }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: 11,
                                            fontFamily: 'var(--font-mono)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.18em',
                                            color: 'hsl(var(--muted-foreground))',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="investment"
                                        stackId="1"
                                        name="Invested"
                                        stroke={INVESTED_COLOR}
                                        strokeWidth={1.5}
                                        fill="url(#colorInv)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="returns"
                                        stackId="1"
                                        name="Returns"
                                        stroke={RETURNS_COLOR}
                                        strokeWidth={1.5}
                                        fill="url(#colorRet)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>
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

