import {
  DASHBOARD_TIME_RANGES,
  DEFAULT_TIME_RANGE,
  STRATEGIC_ALLOCATION,
  ASSET_LEDGER_CONFIG,
  STATUTORY_LIMITS,
  DEFAULT_SIP_SCHEDULE,
  BENCHMARK_ALPHA,
} from '../constants';

describe('Dashboard Subsystem Constants', () => {
  it('defines valid time range intervals and defaults to 6M', () => {
    expect(DASHBOARD_TIME_RANGES).toEqual(['1M', '6M', '1Y', 'ALL']);
    expect(DEFAULT_TIME_RANGE).toBe('6M');
  });

  it('configures strategic allocation model summing to exactly 100%', () => {
    const { equities, mutualFunds, providentFund, preciousMetals } =
      STRATEGIC_ALLOCATION.DEFAULT_SHARES;
    const sum = equities + mutualFunds + providentFund + preciousMetals;
    expect(sum).toBe(100);
    expect(STRATEGIC_ALLOCATION.TARGET_EQUITY_SHARE).toBe(40);
    expect(STRATEGIC_ALLOCATION.BASELINE_PORTFOLIO_VALUE).toBe(1378.4);
  });

  it('defines metadata for all 4 asset classes with distinct visual tokens', () => {
    expect(ASSET_LEDGER_CONFIG).toHaveLength(4);
    const keys = ASSET_LEDGER_CONFIG.map(c => c.key);
    expect(keys).toEqual([
      'equities',
      'mutualFunds',
      'providentFund',
      'preciousMetals',
    ]);

    ASSET_LEDGER_CONFIG.forEach(config => {
      expect(config.label).toBeTruthy();
      expect(config.dotColor).toMatch(/^bg-/);
      expect(config.barColor).toMatch(/^bg-/);
      expect(config.textColor).toMatch(/^text-/);
    });
  });

  it('configures Indian statutory limits and auto-SIP defaults', () => {
    expect(STATUTORY_LIMITS.SECTION_80C_CAP).toBe(150000);
    expect(STATUTORY_LIMITS.DEFAULT_USED_PERCENT).toBe(83);
    expect(DEFAULT_SIP_SCHEDULE.AMOUNT).toBe(30000);
    expect(DEFAULT_SIP_SCHEDULE.DEFAULT_FOLIOS).toBe(2);
  });

  it('specifies the benchmark alpha display constants', () => {
    expect(BENCHMARK_ALPHA.LABEL).toBe('12.4% vs NIFTY 50');
    expect(BENCHMARK_ALPHA.TAG).toBe('Outperforming index');
  });
});
