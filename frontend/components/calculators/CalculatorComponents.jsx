"use client";
import React, { useState } from "react";

// Utility functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
};

// Common Card Component
function Card({ title, children }) {
    return (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 w-full max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-blue-700">{title}</h2>
            {children}
        </div>
    );
}

// Common Input Component
function InputField({ label, value, onChange, type = "number", placeholder, min, max, step = "any" }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

// Results Display Component
function ResultsDisplay({ results }) {
    return (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            {results.map((result, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                    <span className="font-medium text-gray-700">{result.label}:</span>
                    <span className="font-bold text-blue-700">{result.value}</span>
                </div>
            ))}
        </div>
    );
}

// SIP Calculator
export function SIPCalculator() {
    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(10);
    const [stepUp, setStepUp] = useState(0);
    const [results, setResults] = useState(null);

    const calculate = () => {
        // Edge cases
        if (monthlyInvestment <= 0 || monthlyInvestment > 1000000) {
            alert("Monthly investment should be between ₹1 and ₹10,00,000");
            return;
        }
        if (expectedReturn <= 0 || expectedReturn > 50) {
            alert("Expected return should be between 0.1% and 50%");
            return;
        }
        if (timePeriod <= 0 || timePeriod > 50) {
            alert("Time period should be between 1 and 50 years");
            return;
        }

        let totalInvestment = 0;
        let futureValue = 0;
        let currentSIP = monthlyInvestment;
        const monthlyRate = expectedReturn / 100 / 12;

        for (let year = 1; year <= timePeriod; year++) {
            for (let month = 1; month <= 12; month++) {
                totalInvestment += currentSIP;
                const remainingMonths = (timePeriod - year) * 12 + (12 - month);
                futureValue += currentSIP * Math.pow(1 + monthlyRate, remainingMonths);
            }
            if (stepUp > 0) {
                currentSIP = currentSIP * (1 + stepUp / 100);
            }
        }

        const totalGains = futureValue - totalInvestment;

        setResults([
            { label: "Total Investment", value: formatCurrency(totalInvestment) },
            { label: "Future Value", value: formatCurrency(futureValue) },
            { label: "Total Gains", value: formatCurrency(totalGains) },
            { label: "Returns", value: `${((totalGains / totalInvestment) * 100).toFixed(2)}%` }
        ]);
    };

    return (
        <Card title="SIP Calculator">
            <InputField
                label="Monthly Investment (₹)"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                placeholder="Enter monthly SIP amount"
                min="500"
            />
            <InputField
                label="Expected Annual Return (%)"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                placeholder="Expected return rate"
                min="1"
                max="50"
                step="0.1"
            />
            <InputField
                label="Time Period (Years)"
                value={timePeriod}
                onChange={(e) => setTimePeriod(Number(e.target.value))}
                placeholder="Investment duration"
                min="1"
                max="50"
            />
            <InputField
                label="Annual Step-up (%)"
                value={stepUp}
                onChange={(e) => setStepUp(Number(e.target.value))}
                placeholder="Yearly SIP increase"
                min="0"
                max="20"
                step="0.1"
            />
            <button
                onClick={calculate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Calculate SIP
            </button>
            {results && <ResultsDisplay results={results} />}
        </Card>
    );
}

// Lumpsum Calculator
export function LumpsumCalculator() {
    const [principal, setPrincipal] = useState(100000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(10);
    const [results, setResults] = useState(null);

    const calculate = () => {
        // Edge cases
        if (principal <= 0 || principal > 100000000) {
            alert("Investment amount should be between ₹1 and ₹10 crores");
            return;
        }
        if (expectedReturn <= 0 || expectedReturn > 50) {
            alert("Expected return should be between 0.1% and 50%");
            return;
        }
        if (timePeriod <= 0 || timePeriod > 50) {
            alert("Time period should be between 1 and 50 years");
            return;
        }

        const futureValue = principal * Math.pow(1 + expectedReturn / 100, timePeriod);
        const totalGains = futureValue - principal;

        setResults([
            { label: "Investment Amount", value: formatCurrency(principal) },
            { label: "Future Value", value: formatCurrency(futureValue) },
            { label: "Total Gains", value: formatCurrency(totalGains) },
            { label: "Returns", value: `${((totalGains / principal) * 100).toFixed(2)}%` }
        ]);
    };

    return (
        <Card title="Lumpsum Calculator">
            <InputField
                label="Investment Amount (₹)"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                placeholder="Enter lumpsum amount"
                min="1000"
            />
            <InputField
                label="Expected Annual Return (%)"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                placeholder="Expected return rate"
                min="1"
                max="50"
                step="0.1"
            />
            <InputField
                label="Time Period (Years)"
                value={timePeriod}
                onChange={(e) => setTimePeriod(Number(e.target.value))}
                placeholder="Investment duration"
                min="1"
                max="50"
            />
            <button
                onClick={calculate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Calculate Returns
            </button>
            {results && <ResultsDisplay results={results} />}
        </Card>
    );
}

// SWP Calculator
export function SWPCalculator() {
    const [principal, setPrincipal] = useState(1000000);
    const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(8000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(20);
    const [results, setResults] = useState(null);

    const calculate = () => {
        // Edge cases
        if (principal <= 0) {
            alert("Investment amount must be greater than 0");
            return;
        }
        if (monthlyWithdrawal <= 0) {
            alert("Monthly withdrawal amount must be greater than 0");
            return;
        }
        if (expectedReturn <= 0 || expectedReturn > 50) {
            alert("Expected return should be between 0.1% and 50%");
            return;
        }

        const monthlyRate = expectedReturn / 100 / 12;
        let remainingBalance = principal;
        let totalWithdrawn = 0;
        let months = 0;

        for (let i = 0; i < timePeriod * 12; i++) {
            if (remainingBalance <= 0) break;

            // Apply monthly return
            remainingBalance = remainingBalance * (1 + monthlyRate);

            // Withdraw amount
            if (remainingBalance >= monthlyWithdrawal) {
                remainingBalance -= monthlyWithdrawal;
                totalWithdrawn += monthlyWithdrawal;
                months++;
            } else {
                totalWithdrawn += remainingBalance;
                remainingBalance = 0;
                months++;
                break;
            }
        }

        const yearsLasted = months / 12;

        setResults([
            { label: "Initial Investment", value: formatCurrency(principal) },
            { label: "Total Withdrawn", value: formatCurrency(totalWithdrawn) },
            { label: "Remaining Balance", value: formatCurrency(remainingBalance) },
            { label: "Withdrawal Period", value: `${yearsLasted.toFixed(1)} years` },
            { label: "Monthly Withdrawal", value: formatCurrency(monthlyWithdrawal) }
        ]);
    };

    return (
        <Card title="SWP Calculator">
            <InputField
                label="Initial Investment (₹)"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                placeholder="Enter initial amount"
                min="100000"
            />
            <InputField
                label="Monthly Withdrawal (₹)"
                value={monthlyWithdrawal}
                onChange={(e) => setMonthlyWithdrawal(Number(e.target.value))}
                placeholder="Enter monthly withdrawal"
                min="1000"
            />
            <InputField
                label="Expected Annual Return (%)"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                placeholder="Expected return rate"
                min="1"
                max="50"
                step="0.1"
            />
            <InputField
                label="Withdrawal Period (Years)"
                value={timePeriod}
                onChange={(e) => setTimePeriod(Number(e.target.value))}
                placeholder="How long to withdraw"
                min="1"
                max="50"
            />
            <button
                onClick={calculate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Calculate SWP
            </button>
            {results && <ResultsDisplay results={results} />}
        </Card>
    );
}

// Mutual Fund Calculator (Goal-based)
export function MutualFundCalculator() {
    const [goalAmount, setGoalAmount] = useState(1000000);
    const [currentAge, setCurrentAge] = useState(25);
    const [retirementAge, setRetirementAge] = useState(60);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [currentSavings, setCurrentSavings] = useState(0);
    const [results, setResults] = useState(null);

    const calculate = () => {
        // Edge cases
        if (goalAmount <= 0) {
            alert("Goal amount must be greater than 0");
            return;
        }
        if (currentAge >= retirementAge) {
            alert("Current age must be less than retirement age");
            return;
        }
        if (expectedReturn <= 0 || expectedReturn > 50) {
            alert("Expected return should be between 0.1% and 50%");
            return;
        }

        const yearsToGoal = retirementAge - currentAge;
        const monthlyRate = expectedReturn / 100 / 12;
        const totalMonths = yearsToGoal * 12;

        // Future value of current savings
        const futureValueCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToGoal);

        // Required future value from SIP
        const requiredFromSIP = goalAmount - futureValueCurrentSavings;

        // Calculate required monthly SIP
        let requiredMonthlySIP = 0;
        if (requiredFromSIP > 0) {
            requiredMonthlySIP = requiredFromSIP * monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }

        const totalInvestment = currentSavings + (requiredMonthlySIP * totalMonths);

        setResults([
            { label: "Goal Amount", value: formatCurrency(goalAmount) },
            { label: "Years to Goal", value: `${yearsToGoal} years` },
            { label: "Required Monthly SIP", value: formatCurrency(requiredMonthlySIP) },
            { label: "Total Investment", value: formatCurrency(totalInvestment) },
            { label: "Current Savings Growth", value: formatCurrency(futureValueCurrentSavings) }
        ]);
    };

    return (
        <Card title="Mutual Fund Goal Calculator">
            <InputField
                label="Goal Amount (₹)"
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
                placeholder="Enter target amount"
                min="100000"
            />
            <InputField
                label="Current Age"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                placeholder="Your current age"
                min="18"
                max="100"
            />
            <InputField
                label="Target Age"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                placeholder="Age when you need the money"
                min="19"
                max="100"
            />
            <InputField
                label="Expected Annual Return (%)"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                placeholder="Expected return rate"
                min="1"
                max="50"
                step="0.1"
            />
            <InputField
                label="Current Savings (₹)"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                placeholder="Existing savings amount"
                min="0"
            />
            <button
                onClick={calculate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Calculate Goal Plan
            </button>
            {results && <ResultsDisplay results={results} />}
        </Card>
    );
}