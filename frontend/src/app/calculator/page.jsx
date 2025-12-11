"use client";
import React, { useState } from "react";

function Card({ title, children }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6 w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4 text-blue-700">{title}</h2>
      {children}
    </div>
  );
}

function SIPCalculator() {
  const [monthly, setMonthly] = useState(0);
  const [rate, setRate] = useState(0);
  const [years, setYears] = useState(0);
  const [result, setResult] = useState(null);

  function calculate() {
    const n = years * 12;
    const r = rate / 100 / 12;
    const futureValue = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    setResult(futureValue.toFixed(2));
  }

  return (
    <Card title="SIP Calculator">
      <input type="number" placeholder="Monthly Investment" value={monthly} onChange={e => setMonthly(+e.target.value)} className="input" />
      <input type="number" placeholder="Annual Rate (%)" value={rate} onChange={e => setRate(+e.target.value)} className="input" />
      <input type="number" placeholder="Years" value={years} onChange={e => setYears(+e.target.value)} className="input" />
      <button onClick={calculate} className="btn">Calculate</button>
      {result && <div className="mt-2">Future Value: ₹{result}</div>}
    </Card>
  );
}

function EMICalculator() {
  const [principal, setPrincipal] = useState(0);
  const [rate, setRate] = useState(0);
  const [years, setYears] = useState(0);
  const [emi, setEmi] = useState(null);

  function calculate() {
    const n = years * 12;
    const r = rate / 100 / 12;
    const emiValue = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    setEmi(emiValue.toFixed(2));
  }

  return (
    <Card title="EMI Calculator">
      <input type="number" placeholder="Principal" value={principal} onChange={e => setPrincipal(+e.target.value)} className="input" />
      <input type="number" placeholder="Annual Rate (%)" value={rate} onChange={e => setRate(+e.target.value)} className="input" />
      <input type="number" placeholder="Years" value={years} onChange={e => setYears(+e.target.value)} className="input" />
      <button onClick={calculate} className="btn">Calculate</button>
      {emi && <div className="mt-2">Monthly EMI: ₹{emi}</div>}
    </Card>
  );
}

function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState(0);
  const [rate, setRate] = useState(0);
  const [years, setYears] = useState(0);
  const [result, setResult] = useState(null);

  function calculate() {
    const amount = principal * Math.pow(1 + rate / 100, years);
    setResult(amount.toFixed(2));
  }

  return (
    <Card title="Compound Interest Calculator">
      <input type="number" placeholder="Principal" value={principal} onChange={e => setPrincipal(+e.target.value)} className="input" />
      <input type="number" placeholder="Rate (%)" value={rate} onChange={e => setRate(+e.target.value)} className="input" />
      <input type="number" placeholder="Years" value={years} onChange={e => setYears(+e.target.value)} className="input" />
      <button onClick={calculate} className="btn">Calculate</button>
      {result && <div className="mt-2">Future Value: ₹{result}</div>}
    </Card>
  );
}

function FDCalculator() {
  const [principal, setPrincipal] = useState(0);
  const [rate, setRate] = useState(0);
  const [years, setYears] = useState(0);
  const [result, setResult] = useState(null);

  function calculate() {
    const amount = principal + (principal * rate * years) / 100;
    setResult(amount.toFixed(2));
  }

  return (
    <Card title="FD Calculator">
      <input type="number" placeholder="Principal" value={principal} onChange={e => setPrincipal(+e.target.value)} className="input" />
      <input type="number" placeholder="Rate (%)" value={rate} onChange={e => setRate(+e.target.value)} className="input" />
      <input type="number" placeholder="Years" value={years} onChange={e => setYears(+e.target.value)} className="input" />
      <button onClick={calculate} className="btn">Calculate</button>
      {result && <div className="mt-2">Maturity Amount: ₹{result}</div>}
    </Card>
  );
}

export default function CalculatorPage() {
  const [selected, setSelected] = useState(null);
  const calculators = [
    { key: "sip", title: "SIP", desc: "Calculate how much you need to save or how much you will accumulate with your SIP", icon: "💰", component: <SIPCalculator /> },
    { key: "lumpsum", title: "Lumpsum", desc: "Calculate returns for lumpsum investments to achieve your financial goals", icon: "👜" },
    { key: "swp", title: "SWP", desc: "Calculate your final amount with Systematic Withdrawal Plans (SWP)", icon: "🐷" },
    { key: "mf", title: "MF", desc: "Calculate the returns on your mutual fund investments", icon: "📊" },
    { key: "ssy", title: "SSY", desc: "Calculate returns for Sukanya Smariddhi Yojana (SSY) as per your investment", icon: "🧮" },
    { key: "ppf", title: "PPF", desc: "Calculate your returns on Public Provident Fund (PPF)", icon: "📈" },
    { key: "epf", title: "EPF", desc: "Calculate returns for your Employee's Provident Fund (EPF)", icon: "🧪" },
    { key: "fd", title: "FD", desc: "Check returns on your fixed deposits (FDs) without any hassle", icon: "💵", component: <FDCalculator /> },
    { key: "rd", title: "RD", desc: "Check returns on your Recurring Deposit (RD) in just a few clicks", icon: "🪙" },
    { key: "nps", title: "NPS", desc: "Calculate returns for your National Pension Scheme (NPS)", icon: "🏦" },
    { key: "hra", title: "HRA", desc: "Calculate your House Rent Allowance (HRA)", icon: "🏠" },
    { key: "retirement", title: "Retirement", desc: "Calculate how much you need for a relaxed retirement", icon: "🧓" },
    { key: "emi", title: "EMI", desc: "Calculate EMI on your loans – home loan, car loan or personal loan", icon: "📄", component: <EMICalculator /> },
    { key: "carloanemi", title: "Car Loan EMI", desc: "Calculate your car loan EMI", icon: "🚗" },
    { key: "homeloanemi", title: "Home Loan EMI", desc: "Calculate your home loan EMI", icon: "🏡" },
    { key: "simpleinterest", title: "Simple Interest", desc: "Calculate simple interest on your loans and saving schemes investments", icon: "🧾" },
    { key: "compound", title: "Compound Interest", desc: "Calculate compound interest with ease", icon: "🪙", component: <CompoundInterestCalculator /> },
    { key: "nsc", title: "NSC", desc: "Calculate your returns under National Savings Certificate scheme", icon: "☂️" },
    { key: "stepupsip", title: "Step Up SIP", desc: "Calculate SIP Returns with an Yearly Raise", icon: "📈" },
    { key: "incometax", title: "Income Tax", desc: "Calculate your payable income tax with minimal effort", icon: "🧾" },
    { key: "gratuity", title: "Gratuity", desc: "Calculate how much gratuity you will get when you retire", icon: "🐷" },
    { key: "apy", title: "APY", desc: "Calculate your monthly investments under Atal Pension Yojana", icon: "🪙" },
    { key: "cagr", title: "CAGR", desc: "The simplest compound annual growth rate calculator", icon: "📈" },
    { key: "gst", title: "GST", desc: "Calculate your payable GST amount with a few clicks", icon: "🧾" },
    { key: "flatvsreducing", title: "Flat vs Reducing rate", desc: "Compare monthly EMI in Flat and Reducing balance interest rate schemes", icon: "📊" },
    { key: "brokerage", title: "Brokerage", desc: "Calculate brokerage and other charges for your stock orders", icon: "📄" },
    { key: "margin", title: "Margin", desc: "Calculate margin for delivery and intraday based on your order details", icon: "📈" },
    { key: "tds", title: "TDS", desc: "Calculate your TDS deductions", icon: "🧾" },
    { key: "salary", title: "Salary", desc: "Calculate your net take home salary", icon: "👜" },
    { key: "inflation", title: "Inflation", desc: "Calculate inflation adjusted prices", icon: "📈" },
    { key: "postofficemis", title: "Post Office MIS", desc: "Calculate post office monthly income scheme returns", icon: "🧾" },
    { key: "scss", title: "SCSS Calculator", desc: "Calculate senior citizens savings scheme returns", icon: "📈" },
    { key: "stockaverage", title: "Stock Average Calculator", desc: "Calculate average price of your stock investments", icon: "📄" },
    { key: "xirr", title: "XIRR Calculator", desc: "Calculate the extended internal rate of return (XIRR) for your investments", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8 text-blue-800">Calculators</h1>
      {selected === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full max-w-6xl">
          {calculators.map((calc) => (
            <div
              key={calc.key}
              className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between cursor-pointer hover:shadow-xl transition duration-150 h-48"
              onClick={() => calc.component && setSelected(calc.key)}
            >
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">{calc.title}</h2>
                <span className="text-gray-500 text-sm">{calc.desc}</span>
              </div>
              <div className="text-4xl mt-4 text-right">{calc.icon}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto">
          <button
            className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
            onClick={() => setSelected(null)}
          >
            ← Back
          </button>
          {calculators.find((calc) => calc.key === selected)?.component}
        </div>
      )}
      <style jsx>{`
        .input {
          display: block;
          width: 100%;
          margin-bottom: 8px;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }
        .btn {
          background: #2563eb;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          margin-top: 4px;
        }
        .btn:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
