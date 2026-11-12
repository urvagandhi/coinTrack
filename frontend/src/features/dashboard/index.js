// frontend/src/features/dashboard/index.js — Clean barrel export for Dashboard subsystem

// ── Views & Primary Containers ──
export {
  DashboardView,
  default as DashboardViewDefault,
} from './components/DashboardView';
export { DashboardHeader } from './components/DashboardHeader';

// ── Asymmetric Bento & Metrics ──
export { DashboardKpiGrid } from './components/DashboardKpiGrid';
export { TotalNetWorthCard } from './components/TotalNetWorthCard';
export { MomentumAndCashCard } from './components/MomentumAndCashCard';

// ── Visualizations & Tables ──
export { DashboardWealthChart } from './components/DashboardWealthChart';
export { HoldingsTable } from './components/HoldingsTable';

// ── Multi-Ledger Spread & Schedules ──
export { DashboardAssetSpread } from './components/DashboardAssetSpread';
export { AssetDistributionCard } from './components/AssetDistributionCard';
export { LedgerScheduleCard } from './components/LedgerScheduleCard';

// ── Utilities & Shared Cards ──
export { RefreshButton } from './components/RefreshButton';
export { StatsCard } from './components/StatsCard';
export { PortfolioSummary } from './components/PortfolioSummary';

// ── Constants ──
export * from './constants';
