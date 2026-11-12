// frontend/src/features/dashboard/constants.js — Centralized Constants for Dashboard Subsystem

export const DASHBOARD_TIME_RANGES = ['1M', '6M', '1Y', 'ALL'];
export const DEFAULT_TIME_RANGE = '6M';

export const STRATEGIC_ALLOCATION = {
  TARGET_EQUITY_SHARE: 40, // Strategic threshold for rebalancing drift
  DEFAULT_SHARES: {
    equities: 42,
    mutualFunds: 28,
    providentFund: 16,
    preciousMetals: 14,
  },
  DEFAULT_VALUES: {
    equities: 579,
    mutualFunds: 386,
    providentFund: 221,
    preciousMetals: 193,
  },
  BASELINE_PORTFOLIO_VALUE: 1378.4,
};

export const ASSET_LEDGER_CONFIG = [
  {
    key: 'equities',
    label: 'Equities',
    dotColor: 'bg-blue-600',
    barColor: 'bg-blue-600',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'mutualFunds',
    label: 'Mutual Funds',
    dotColor: 'bg-orange-500',
    barColor: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    key: 'providentFund',
    label: 'EPF & Fixed Income',
    dotColor: 'bg-emerald-500',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'preciousMetals',
    label: 'Gold & Silver',
    dotColor: 'bg-amber-500',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
];

export const STATUTORY_LIMITS = {
  SECTION_80C_CAP: 150000,
  DEFAULT_USED_PERCENT: 83,
};

export const DEFAULT_SIP_SCHEDULE = {
  AMOUNT: 30000,
  DEFAULT_FOLIOS: 2,
};

export const BENCHMARK_ALPHA = {
  LABEL: '12.4% vs NIFTY 50',
  TAG: 'Outperforming index',
};
