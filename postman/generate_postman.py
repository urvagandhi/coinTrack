#!/usr/bin/env python3
"""
CoinTrack Postman Ecosystem Generator
Generates:
1. CoinTrack_API_Collection.json (Master Reference & Interactive API collection, 130+ endpoints)
2. CoinTrack_E2E_Workflow.json (Automated sequential integration test runner)
3. CoinTrack_Local_Environment.json (Local development environment with smart variables)
4. CoinTrack_Staging_Environment.json (Staging/Production environment template)
"""

import json
import os

# ==============================================================================
# 1. VISUALIZER TEMPLATES (Terminal Editorial Dark Theme)
# ==============================================================================

CSS_BASE = """
<style>
    :root {
        --bg: #090a0f;
        --surface: #12151e;
        --surface-hover: #181d2a;
        --border: #1e2333;
        --border-subtle: #2a3148;
        --text: #e2e8f0;
        --text-muted: #94a3b8;
        --text-dim: #64748b;
        --emerald: #10b981;
        --emerald-bg: rgba(16, 185, 129, 0.12);
        --rose: #ef4444;
        --rose-bg: rgba(239, 68, 68, 0.12);
        --amber: #f59e0b;
        --amber-bg: rgba(245, 158, 11, 0.12);
        --indigo: #6366f1;
        --indigo-bg: rgba(99, 102, 241, 0.12);
        --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        background-color: var(--bg);
        color: var(--text);
        font-family: var(--sans);
        padding: 24px;
        line-height: 1.5;
        font-size: 13px;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 20px;
    }
    .brand {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .brand-pill {
        font-family: var(--mono);
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: var(--indigo-bg);
        color: var(--indigo);
        border: 1px solid rgba(99, 102, 241, 0.25);
        padding: 2px 8px;
        border-radius: 4px;
    }
    h2 { font-size: 18px; font-weight: 600; color: #fff; letter-spacing: -0.02em; }
    .meta-time { font-family: var(--mono); font-size: 11px; color: var(--text-dim); }
    .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
    }
    .kpi-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 16px;
    }
    .kpi-label {
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
    }
    .kpi-value {
        font-family: var(--mono);
        font-size: 20px;
        font-weight: 700;
        color: #fff;
    }
    .positive { color: var(--emerald) !important; }
    .negative { color: var(--rose) !important; }
    .neutral { color: var(--amber) !important; }
    .table-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        overflow: hidden;
    }
    .table-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .table-title { font-size: 13px; font-weight: 600; color: #fff; }
    table { width: 100%; border-collapse: collapse; }
    th {
        background: rgba(255, 255, 255, 0.02);
        color: var(--text-muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: left;
        padding: 10px 16px;
        border-bottom: 1px solid var(--border);
    }
    td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        font-size: 12px;
        color: var(--text);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--surface-hover); }
    .mono { font-family: var(--mono); }
    .badge {
        display: inline-block;
        font-size: 10px;
        padding: 2px 7px;
        border-radius: 4px;
        font-family: var(--mono);
        font-weight: 600;
    }
    .badge-green { background: var(--emerald-bg); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-red { background: var(--rose-bg); color: var(--rose); border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-amber { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-gray { background: rgba(148, 163, 184, 0.1); color: #cbd5e1; border: 1px solid var(--border); }
</style>
"""

VISUALIZER_PORTFOLIO_SUMMARY = f"""
const res = pm.response.json();
const data = res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">PORTFOLIO</span>
            <h2>Consolidated Portfolio Summary</h2>
        </div>
        <div class="meta-time">Updated: {{{{meta.updatedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Current Value</div>
            <div class="kpi-value">₹ {{{{summary.totalCurrentValue}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Invested</div>
            <div class="kpi-value">₹ {{{{summary.totalInvestedValue}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Overall Unrealized P&L</div>
            <div class="kpi-value {{{{summary.pnlClass}}}}">₹ {{{{summary.totalPnl}}}} ({{{{summary.totalReturnPercent}}}}%)</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Today's P&L</div>
            <div class="kpi-value {{{{summary.dayPnlClass}}}}">₹ {{{{summary.dayGain}}}}</div>
        </div>
    </div>
</body>
`;

const inv = Number(data.totalInvestedValue || data.totalInvestment || 0);
const cur = Number(data.totalCurrentValue || data.currentValue || 0);
const pnl = Number(data.totalUnrealizedPL || data.overallProfitLoss || (cur - inv));
const pnlPct = inv > 0 ? ((pnl / inv) * 100).toFixed(2) : "0.00";
const day = Number(data.dayGain || data.todayGain || 0);

pm.visualizer.set(template, {{
    meta: {{ updatedAt: new Date().toLocaleTimeString() }},
    summary: {{
        totalCurrentValue: cur.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
        totalInvestedValue: inv.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
        totalPnl: (pnl >= 0 ? "+" : "") + pnl.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
        totalReturnPercent: (pnl >= 0 ? "+" : "") + pnlPct,
        pnlClass: pnl >= 0 ? "positive" : "negative",
        dayGain: (day >= 0 ? "+" : "") + day.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
        dayPnlClass: day >= 0 ? "positive" : "negative"
    }}
}});
"""

VISUALIZER_HOLDINGS = f"""
const res = pm.response.json();
const items = Array.isArray(res) ? res : (res.data || res.holdings || []);

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">EQUITIES</span>
            <h2>Holdings Ledger ({{{{holdings.length}}}} Assets)</h2>
        </div>
        <div class="meta-time">Updated: {{{{updatedAt}}}}</div>
    </div>
    <div class="table-card">
        <table>
            <thead>
                <tr>
                    <th>Symbol / Exchange</th>
                    <th>Broker</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                    <th>LTP</th>
                    <th>Current Value</th>
                    <th>P&L</th>
                </tr>
            </thead>
            <tbody>
                {{{{#each holdings}}}}
                <tr>
                    <td>
                        <span class="mono" style="font-weight:700; color:#fff;">{{{{symbol}}}}</span>
                        <span class="badge badge-gray" style="margin-left:6px;">{{{{exchange}}}}</span>
                    </td>
                    <td><span class="badge badge-amber">{{{{broker}}}}</span></td>
                    <td class="mono">{{{{quantity}}}}</td>
                    <td class="mono">₹ {{{{avgPrice}}}}</td>
                    <td class="mono">₹ {{{{currentPrice}}}}</td>
                    <td class="mono" style="font-weight:600;">₹ {{{{currentValue}}}}</td>
                    <td class="mono {{{{pnlClass}}}}" style="font-weight:600;">{{{{pnl}}}} ({{{{returnPct}}}}%)</td>
                </tr>
                {{{{/each}}}}
            </tbody>
        </table>
    </div>
</body>
`;

const formatted = items.map(h => {{
    const qty = Number(h.quantity || 0);
    const avg = Number(h.averageBuyPrice || h.averagePrice || 0);
    const ltp = Number(h.currentPrice || h.lastPrice || 0);
    const curVal = Number(h.currentValue || (qty * ltp));
    const invVal = Number(h.investedValue || (qty * avg));
    const pnl = Number(h.unrealizedPL || (curVal - invVal));
    const pnlPct = invVal > 0 ? ((pnl / invVal) * 100).toFixed(2) : "0.00";
    return {{
        symbol: h.symbol || h.tradingsymbol || "N/A",
        exchange: h.exchange || "NSE",
        broker: h.broker || "BROKER",
        quantity: qty,
        avgPrice: avg.toFixed(2),
        currentPrice: ltp.toFixed(2),
        currentValue: curVal.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
        pnl: (pnl >= 0 ? "+" : "") + pnl.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
        returnPct: (pnl >= 0 ? "+" : "") + pnlPct,
        pnlClass: pnl >= 0 ? "positive" : "negative"
    }};
}});

pm.visualizer.set(template, {{ holdings: formatted, updatedAt: new Date().toLocaleTimeString() }});
"""

VISUALIZER_MF_DASHBOARD = f"""
const res = pm.response.json();
const data = res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">MUTUAL FUNDS</span>
            <h2>Mutual Funds Portfolio Overview</h2>
        </div>
        <div class="meta-time">Updated: {{{{updatedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Current Valuation</div>
            <div class="kpi-value">₹ {{{{currentValuation}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Investment</div>
            <div class="kpi-value">₹ {{{{totalInvestment}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Absolute Gains</div>
            <div class="kpi-value {{{{gainClass}}}}">₹ {{{{totalGain}}}} ({{{{absoluteReturn}}}}%)</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Active Schemes</div>
            <div class="kpi-value">{{{{activeSchemesCount}}}}</div>
        </div>
    </div>
</body>
`;

const cur = Number(data.currentValuation || data.currentValue || 0);
const inv = Number(data.totalInvestment || data.investedAmount || 0);
const gain = Number(data.totalGain || (cur - inv));
const absRet = inv > 0 ? ((gain / inv) * 100).toFixed(2) : "0.00";

pm.visualizer.set(template, {{
    currentValuation: cur.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalInvestment: inv.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalGain: (gain >= 0 ? "+" : "") + gain.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    absoluteReturn: (gain >= 0 ? "+" : "") + absRet,
    gainClass: gain >= 0 ? "positive" : "negative",
    activeSchemesCount: data.schemeCount || data.activeSchemesCount || "N/A",
    updatedAt: new Date().toLocaleTimeString()
}});
"""

VISUALIZER_EPF_SUMMARY = f"""
const res = pm.response.json();
const data = res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">EPF & EPS</span>
            <h2>EPF Account Statement Summary</h2>
        </div>
        <div class="meta-time">Updated: {{{{updatedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Current EPF Balance</div>
            <div class="kpi-value positive">₹ {{{{epfBalance}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Current EPS Balance</div>
            <div class="kpi-value">₹ {{{{epsBalance}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Employee Lifetime Contribution</div>
            <div class="kpi-value">₹ {{{{employeeContrib}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Employer Lifetime Contribution</div>
            <div class="kpi-value">₹ {{{{employerContrib}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">VPF Contributed</div>
            <div class="kpi-value">₹ {{{{vpfAmount}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Lifetime Interest Credited</div>
            <div class="kpi-value positive">₹ {{{{interestCredited}}}}</div>
        </div>
    </div>
</body>
`;

pm.visualizer.set(template, {{
    epfBalance: Number(data.currentEpfBalance || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    epsBalance: Number(data.currentEpsBalance || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    employeeContrib: Number(data.totalEmployeeContribution || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    employerContrib: Number(data.totalEmployerEpfContribution || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    vpfAmount: Number(data.totalVpfContributed || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    interestCredited: Number(data.interestCreditedLifetimeEpf || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    updatedAt: new Date().toLocaleTimeString()
}});
"""

VISUALIZER_PPF_SUMMARY = f"""
const res = pm.response.json();
const data = res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">PPF</span>
            <h2>Public Provident Fund Summary</h2>
        </div>
        <div class="meta-time">Updated: {{{{updatedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Current Balance</div>
            <div class="kpi-value positive">₹ {{{{currentBalance}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Deposits</div>
            <div class="kpi-value">₹ {{{{totalDeposits}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Interest Credited</div>
            <div class="kpi-value positive">₹ {{{{totalInterest}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Withdrawals</div>
            <div class="kpi-value">₹ {{{{totalWithdrawals}}}}</div>
        </div>
    </div>
</body>
`;

pm.visualizer.set(template, {{
    currentBalance: Number(data.currentBalance || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalDeposits: Number(data.totalDeposits || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalInterest: Number(data.totalInterestCredited || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalWithdrawals: Number(data.totalWithdrawals || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    updatedAt: new Date().toLocaleTimeString()
}});
"""

VISUALIZER_FD_SUMMARY = f"""
const res = pm.response.json();
const data = res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">FIXED DEPOSITS</span>
            <h2>Fixed Deposits Portfolio Overview</h2>
        </div>
        <div class="meta-time">Updated: {{{{updatedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Active Investment</div>
            <div class="kpi-value">₹ {{{{activeInvestment}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Estimated Returns</div>
            <div class="kpi-value positive">₹ {{{{estimatedReturns}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Active FDs Count</div>
            <div class="kpi-value">{{{{activeCount}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total TDS Deducted</div>
            <div class="kpi-value negative">₹ {{{{tdsDeducted}}}}</div>
        </div>
    </div>
</body>
`;

pm.visualizer.set(template, {{
    activeInvestment: Number(data.totalActiveInvestment || data.totalInvestment || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    estimatedReturns: Number(data.totalEstimatedReturns || data.totalReturns || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    activeCount: data.activeCount || 0,
    tdsDeducted: Number(data.totalTdsDeducted || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    updatedAt: new Date().toLocaleTimeString()
}});
"""

VISUALIZER_GOLD_SILVER_SUMMARY = f"""
const res = pm.response.json();
const data = res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">PRECIOUS METALS</span>
            <h2>Gold & Silver Holdings Overview</h2>
        </div>
        <div class="meta-time">Updated: {{{{updatedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Current Market Value</div>
            <div class="kpi-value">₹ {{{{currentValue}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Invested</div>
            <div class="kpi-value">₹ {{{{totalInvested}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Bullion Profit / Loss</div>
            <div class="kpi-value {{{{pnlClass}}}}">₹ {{{{overallPnl}}}} ({{{{returnPercent}}}}%)</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Gold Holdings</div>
            <div class="kpi-value neutral">{{{{goldWeight}}}} g (₹ {{{{goldInvested}}}})</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Silver Holdings</div>
            <div class="kpi-value">{{{{silverWeight}}}} g (₹ {{{{silverInvested}}}})</div>
        </div>
    </div>
</body>
`;

const inv = Number(data.totalInvested || 0);
const cur = Number(data.currentValue || 0);
const pnl = Number(data.overallProfitLoss || (cur - inv));
const pct = Number(data.overallReturnPercent || (inv > 0 ? ((pnl / inv) * 100) : 0)).toFixed(2);

pm.visualizer.set(template, {{
    currentValue: cur.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalInvested: inv.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    overallPnl: (pnl >= 0 ? "+" : "") + pnl.toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    returnPercent: (pnl >= 0 ? "+" : "") + pct,
    pnlClass: pnl >= 0 ? "positive" : "negative",
    goldWeight: Number(data.totalGoldWeight || 0).toFixed(2),
    goldInvested: Number(data.totalGoldInvestment || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    silverWeight: Number(data.totalSilverWeight || 0).toFixed(2),
    silverInvested: Number(data.totalSilverInvestment || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    updatedAt: new Date().toLocaleTimeString()
}});
"""

VISUALIZER_CALCULATOR_SIP = f"""
const res = pm.response.json();
const data = res.result || res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">CALCULATOR</span>
            <h2>Systematic Investment Plan (SIP) Projection</h2>
        </div>
        <div class="meta-time">Computed: {{{{computedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Total Maturity Value</div>
            <div class="kpi-value positive">₹ {{{{maturityValue}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Amount Invested</div>
            <div class="kpi-value">₹ {{{{totalInvested}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Estimated Wealth Gained</div>
            <div class="kpi-value positive">₹ {{{{wealthGained}}}}</div>
        </div>
    </div>
</body>
`;

pm.visualizer.set(template, {{
    maturityValue: Number(data.totalValue || data.maturityAmount || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalInvested: Number(data.investedAmount || data.totalInvested || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    wealthGained: Number(data.estimatedReturns || data.wealthGained || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    computedAt: new Date().toLocaleTimeString()
}});
"""

VISUALIZER_CALCULATOR_EMI = f"""
const res = pm.response.json();
const data = res.result || res.data || res;

const template = `
{CSS_BASE}
<body>
    <div class="header">
        <div class="brand">
            <span class="brand-pill">LOAN CALCULATOR</span>
            <h2>Equated Monthly Installment (EMI) Breakdown</h2>
        </div>
        <div class="meta-time">Computed: {{{{computedAt}}}}</div>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Monthly EMI</div>
            <div class="kpi-value neutral">₹ {{{{monthlyEmi}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Principal Loan Amount</div>
            <div class="kpi-value">₹ {{{{principal}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Interest Payable</div>
            <div class="kpi-value negative">₹ {{{{totalInterest}}}}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Amount Payable</div>
            <div class="kpi-value">₹ {{{{totalPayable}}}}</div>
        </div>
    </div>
</body>
`;

pm.visualizer.set(template, {{
    monthlyEmi: Number(data.monthlyEmi || data.emi || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    principal: Number(data.principal || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalInterest: Number(data.totalInterest || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    totalPayable: Number(data.totalPayment || data.totalAmount || 0).toLocaleString('en-IN', {{ maximumFractionDigits: 2 }}),
    computedAt: new Date().toLocaleTimeString()
}});
"""

# ==============================================================================
# 2. SCRIPT BUILDERS
# ==============================================================================

COLLECTION_PRE_REQUEST_SCRIPT = """// ==============================================================================
// CoinTrack Collection-Level Pre-Request Hook
// ==============================================================================

// 1. Setup Request Timestamp & Trace ID
const requestTimestamp = Date.now().toString();
pm.variables.set("requestTimestamp", requestTimestamp);
pm.variables.set("clientRequestId", "req_" + Math.random().toString(36).substring(2, 12));

// 2. RFC 6238 TOTP Generator Helper
function generateTotp(secretBase32) {
    if (!secretBase32) return "";
    var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var bits = "";
    var cleanSecret = secretBase32.replace(/[\\s-]/g, '').toUpperCase();
    for (var i = 0; i < cleanSecret.length; i++) {
        var val = base32chars.indexOf(cleanSecret.charAt(i));
        if (val === -1) continue;
        bits += ('00000' + val.toString(2)).slice(-5);
    }
    var hex = [];
    for (var j = 0; j + 8 <= bits.length; j += 8) {
        hex.push(('0' + parseInt(bits.substr(j, 8), 2).toString(16)).slice(-2));
    }
    var keyBytes = CryptoJS.enc.Hex.parse(hex.join(''));
    var epoch = Math.floor(Date.now() / 1000.0);
    var timeHex = ('0000000000000000' + Math.floor(epoch / 30).toString(16)).slice(-16);
    var timeBytes = CryptoJS.enc.Hex.parse(timeHex);
    var hmac = CryptoJS.HmacSHA1(timeBytes, keyBytes).toString(CryptoJS.enc.Hex);
    var offset = parseInt(hmac.substring(hmac.length - 1), 16);
    var otpPart = (parseInt(hmac.substr(offset * 2, 8), 16) & 0x7fffffff) + '';
    return ('000000' + otpPart).slice(-6);
}

// Auto-populate totpCode if totpSecret is configured in environment
const currentSecret = pm.environment.get("totpSecret");
if (currentSecret && currentSecret.length >= 16) {
    try {
        const otp = generateTotp(currentSecret);
        pm.variables.set("dynamicTotpCode", otp);
    } catch (e) {
        console.warn("Could not generate TOTP code:", e.message);
    }
}

// 3. Silent JWT Access Token Auto-Refresh
const baseUrl = pm.environment.get("baseUrl") || "http://localhost:8080";
const token = pm.environment.get("token");
const expiresAt = pm.environment.get("tokenExpiresAt");
const refreshToken = pm.environment.get("refreshToken");
const path = pm.request.url.getPath ? pm.request.url.getPath().join("/") : "";

// Avoid refreshing on auth endpoints themselves
const isAuthEndpoint = path.includes("auth/login") || path.includes("auth/refresh") || path.includes("auth/register");
const isExpired = expiresAt && (Date.now() >= (parseInt(expiresAt) - 30000));

if (!isAuthEndpoint && token && isExpired && refreshToken) {
    console.log("Access token expired. Executing silent token refresh...");
    pm.sendRequest({
        url: baseUrl + "/api/auth/refresh",
        method: "POST",
        header: { "Content-Type": "application/json" },
        body: { mode: "raw", raw: JSON.stringify({ refreshToken: refreshToken }) }
    }, function (err, res) {
        if (!err && res.code === 200) {
            const body = res.json();
            const newToken = body.token || body.accessToken;
            if (newToken) {
                pm.environment.set("token", newToken);
                console.log("Token successfully refreshed silently.");
            }
            if (body.refreshToken) {
                pm.environment.set("refreshToken", body.refreshToken);
            }
        }
    });
}
"""

COLLECTION_TEST_SCRIPT = """// ==============================================================================
// CoinTrack Collection-Level Test Script
// ==============================================================================

// 1. Response Time SLA Budget Check
pm.test("Response time is within SLA budget (< 3500ms)", function () {
    pm.expect(pm.response.responseTime).to.be.below(3500);
});

// 2. Structured Failure Diagnostic Logger
if (pm.response.code >= 400) {
    console.error("Endpoint Failed: " + pm.request.method + " " + pm.request.url.toString());
    console.error("Status: " + pm.response.code + " " + pm.response.status);
    try {
        console.error("Error Payload:", pm.response.json());
    } catch(e) {
        console.error("Raw Body:", pm.response.text());
    }
}
"""

def make_test_script(status_code=200, checks=None, extra_script="", visualizer_script=""):
    lines = [
        f'pm.test("Status code is {status_code}", function () {{',
        f'    pm.response.to.have.status({status_code});',
        '});'
    ]
    if status_code in (200, 201):
        lines.append('pm.test("Response is valid JSON format", function () {')
        lines.append('    pm.response.to.be.withBody;')
        lines.append('    pm.response.to.be.json;')
        lines.append('});')
        
    if checks:
        for title, expr in checks:
            lines.append(f'pm.test("{title}", function () {{')
            lines.append(f'    const json = pm.response.json();')
            lines.append(f'    {expr}')
            lines.append('});')

    if extra_script:
        lines.append(extra_script)

    if visualizer_script:
        lines.append("// --- Response Visualizer ---")
        lines.append(visualizer_script)

    return "\n".join(lines)

def make_request(
    name,
    method,
    url_path,
    body=None,
    query=None,
    path_vars=None,
    description="",
    test_script="",
    pre_script="",
    auth_override=None
):
    url_parts = [p for p in url_path.split("/") if p]
    raw_url = "{{baseUrl}}" + url_path

    url_obj = {
        "raw": raw_url,
        "host": ["{{baseUrl}}"],
        "path": url_parts
    }

    if query:
        url_obj["query"] = [{"key": k, "value": v, "description": desc} for k, v, desc in query]

    if path_vars:
        url_obj["variable"] = [{"key": k, "value": v, "description": desc} for k, v, desc in path_vars]

    req_obj = {
        "method": method,
        "header": [
            {"key": "Accept", "value": "application/json", "type": "text"}
        ],
        "url": url_obj,
        "description": description
    }

    if body is not None:
        req_obj["header"].append({"key": "Content-Type", "value": "application/json", "type": "text"})
        req_obj["body"] = {
            "mode": "raw",
            "raw": json.dumps(body, indent=2) if isinstance(body, (dict, list)) else str(body)
        }

    if auth_override is not None:
        req_obj["auth"] = auth_override

    events = []
    if pre_script:
        events.append({
            "listen": "prerequest",
            "script": {
                "type": "text/javascript",
                "exec": pre_script.split("\n")
            }
        })
    if test_script:
        events.append({
            "listen": "test",
            "script": {
                "type": "text/javascript",
                "exec": test_script.split("\n")
            }
        })

    item = {
        "name": name,
        "request": req_obj,
        "response": []
    }
    if events:
        item["event"] = events

    return item

print("Initialized generator helpers.")
